import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidToken } from "@/utils/token";
import { getBusySlots } from "@/utils/calendar";
import { calculateAvailableSlots } from "@/utils/slots";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const date = searchParams.get("date");

  if (!slug || !date) {
    return NextResponse.json(
      { error: "slug and date are required" },
      { status: 400 }
    );
  }

  const page = await prisma.bookingPage.findUnique({
    where: { slug, isActive: true },
    include: { user: { select: { id: true } } },
  });

  if (!page) {
    return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidToken(page.user.id);
  } catch {
    return NextResponse.json(
      { error: "Calendar access unavailable" },
      { status: 503 }
    );
  }

  let busySlots: Array<{ start: string; end: string }> = [];
  try {
    busySlots = await getBusySlots(accessToken, date, page.timezone);
  } catch {
    // If calendar fetch fails, continue with no busy slots
    // (better to show potentially conflicting slots than none)
  }

  // Also include existing confirmed bookings as busy
  const existingBookings = await prisma.booking.findMany({
    where: {
      bookingPageId: page.id,
      status: "confirmed",
      startTime: {
        gte: new Date(`${date}T00:00:00Z`),
        lt: new Date(`${date}T23:59:59Z`),
      },
    },
    select: { startTime: true, endTime: true },
  });

  const bookingBusy = existingBookings.map((b) => ({
    start: b.startTime.toISOString(),
    end: b.endTime.toISOString(),
  }));

  const allBusy = [...busySlots, ...bookingBusy];

  const slots = calculateAvailableSlots({
    workingStart: page.workingStart,
    workingEnd: page.workingEnd,
    workingDays: page.workingDays,
    durationMinutes: page.durationMinutes,
    bufferMinutes: page.bufferMinutes,
    busySlots: allBusy,
    date,
    timezone: page.timezone,
  });

  return NextResponse.json({ slots });
}
