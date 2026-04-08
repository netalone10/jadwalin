import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const excludeId = searchParams.get("excludeId");

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const existing = await prisma.bookingPage.findUnique({ where: { slug } });
  const taken = existing !== null && existing.id !== excludeId;

  return NextResponse.json({ available: !taken });
}
