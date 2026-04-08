import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const page = await prisma.bookingPage.findUnique({
    where: { slug, isActive: true },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description,
    durationMinutes: page.durationMinutes,
    accentColor: page.accentColor,
    workingDays: page.workingDays,
    workingStart: page.workingStart,
    workingEnd: page.workingEnd,
    timezone: page.timezone,
    hostName: page.user.name,
  });
}
