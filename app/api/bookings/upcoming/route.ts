import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      startTime: { gte: new Date() },
      bookingPage: { userId: session.userId },
    },
    orderBy: { startTime: "asc" },
    take: 5,
    include: {
      bookingPage: { select: { title: true, timezone: true } },
    },
  });

  return NextResponse.json(bookings);
}
