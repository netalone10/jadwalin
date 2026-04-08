import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const page = await prisma.bookingPage.findUnique({ where: { id } });

  if (!page || page.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const page = await prisma.bookingPage.findUnique({ where: { id } });
  if (!page || page.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If slug is being changed, check uniqueness
  if (body.slug && body.slug !== page.slug) {
    const existing = await prisma.bookingPage.findUnique({
      where: { slug: body.slug },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
  }

  const updated = await prisma.bookingPage.update({
    where: { id },
    data: {
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.durationMinutes !== undefined && { durationMinutes: body.durationMinutes }),
      ...(body.bufferMinutes !== undefined && { bufferMinutes: body.bufferMinutes }),
      ...(body.timezone !== undefined && { timezone: body.timezone }),
      ...(body.accentColor !== undefined && { accentColor: body.accentColor }),
      ...(body.workingDays !== undefined && { workingDays: body.workingDays }),
      ...(body.workingStart !== undefined && { workingStart: body.workingStart }),
      ...(body.workingEnd !== undefined && { workingEnd: body.workingEnd }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const page = await prisma.bookingPage.findUnique({ where: { id } });
  if (!page || page.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.bookingPage.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
