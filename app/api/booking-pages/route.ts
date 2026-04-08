import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pages = await prisma.bookingPage.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    slug,
    title,
    description,
    durationMinutes,
    bufferMinutes,
    timezone,
    accentColor,
    workingDays,
    workingStart,
    workingEnd,
  } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  // Check slug uniqueness
  const existing = await prisma.bookingPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const page = await prisma.bookingPage.create({
    data: {
      userId: session.userId,
      slug,
      title,
      description: description || null,
      durationMinutes: durationMinutes ?? 30,
      bufferMinutes: bufferMinutes ?? 0,
      timezone: timezone ?? "Asia/Jakarta",
      accentColor: accentColor ?? "#3B82F6",
      workingDays: workingDays ?? [1, 2, 3, 4, 5],
      workingStart: workingStart ?? "09:00",
      workingEnd: workingEnd ?? "17:00",
    },
  });

  return NextResponse.json(page, { status: 201 });
}
