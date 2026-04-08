import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidToken } from "@/utils/token";
import { getBusySlots, createCalendarEvent } from "@/utils/calendar";
import { calculateAvailableSlots } from "@/utils/slots";
import { sendBookingConfirmation } from "@/utils/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, startTime, endTime, bookerName, bookerEmail, notes } = body;

  if (!slug || !startTime || !endTime || !bookerName || !bookerEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const page = await prisma.bookingPage.findUnique({
    where: { slug, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
  }

  // Re-check slot availability (anti race condition)
  let accessToken: string;
  try {
    accessToken = await getValidToken(page.user.id);
  } catch {
    return NextResponse.json(
      { error: "Calendar access unavailable. Please contact the host." },
      { status: 503 }
    );
  }

  const slotDate = startTime.split("T")[0];

  const [busySlots, existingBookings] = await Promise.all([
    getBusySlots(accessToken, slotDate, page.timezone).catch(() => []),
    prisma.booking.findMany({
      where: {
        bookingPageId: page.id,
        status: "confirmed",
        startTime: { gte: new Date(`${slotDate}T00:00:00Z`), lt: new Date(`${slotDate}T23:59:59Z`) },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  const bookingBusy = existingBookings.map((b) => ({
    start: b.startTime.toISOString(),
    end: b.endTime.toISOString(),
  }));

  const availableSlots = calculateAvailableSlots({
    workingStart: page.workingStart,
    workingEnd: page.workingEnd,
    workingDays: page.workingDays,
    durationMinutes: page.durationMinutes,
    bufferMinutes: page.bufferMinutes,
    busySlots: [...busySlots, ...bookingBusy],
    date: slotDate,
    timezone: page.timezone,
  });

  const isAvailable = availableSlots.some(
    (s) =>
      new Date(s.startTime).getTime() === new Date(startTime).getTime() &&
      new Date(s.endTime).getTime() === new Date(endTime).getTime()
  );

  if (!isAvailable) {
    return NextResponse.json(
      { error: "This slot is no longer available. Please pick another time." },
      { status: 409 }
    );
  }

  // Create Google Calendar event
  let googleEventId: string | null = null;
  try {
    googleEventId = await createCalendarEvent(accessToken, {
      startTime,
      endTime,
      bookerName,
      bookerEmail,
      eventTitle: page.title,
      timezone: page.timezone,
      notes: notes ?? undefined,
    });
  } catch (err) {
    console.error("Failed to create calendar event:", err);
    return NextResponse.json(
      { error: "Failed to create calendar event. Please try again." },
      { status: 500 }
    );
  }

  // Save booking to DB
  const booking = await prisma.booking.create({
    data: {
      bookingPageId: page.id,
      bookerName,
      bookerEmail,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      googleEventId,
      status: "confirmed",
      notes: notes ?? null,
    },
  });

  // Send emails (fire and forget)
  sendBookingConfirmation({
    bookerEmail,
    bookerName,
    hostName: page.user.name,
    hostEmail: page.user.email,
    eventTitle: page.title,
    startTime,
    endTime,
    timezone: page.timezone,
  }).catch((err) => console.error("Email send failed:", err));

  return NextResponse.json({ success: true, bookingId: booking.id }, { status: 201 });
}
