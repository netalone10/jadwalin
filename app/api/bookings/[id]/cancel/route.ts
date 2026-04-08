import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidToken } from "@/utils/token";
import { deleteCalendarEvent } from "@/utils/calendar";
import { sendCancellationNotification } from "@/utils/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      bookingPage: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.bookingPage.userId !== session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  // Delete from Google Calendar
  if (booking.googleEventId) {
    try {
      const accessToken = await getValidToken(session.userId);
      await deleteCalendarEvent(accessToken, booking.googleEventId);
    } catch (err) {
      console.error("Failed to delete calendar event:", err);
      // Continue with cancellation even if calendar delete fails
    }
  }

  // Update booking status
  await prisma.booking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  // Send cancellation emails (fire and forget)
  sendCancellationNotification({
    bookerEmail: booking.bookerEmail,
    bookerName: booking.bookerName,
    hostEmail: booking.bookingPage.user.email,
    hostName: booking.bookingPage.user.name,
    eventTitle: booking.bookingPage.title,
    startTime: booking.startTime.toISOString(),
    timezone: booking.bookingPage.timezone,
  }).catch((err) => console.error("Cancellation email failed:", err));

  return NextResponse.json({ success: true });
}
