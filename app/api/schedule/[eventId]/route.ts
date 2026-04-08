import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getValidToken } from "@/utils/token";
import { deleteCalendarEvent } from "@/utils/calendar";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  const accessToken = await getValidToken(session.userId);

  try {
    await deleteCalendarEvent(accessToken, eventId);
  } catch (err: unknown) {
    const status = (err as { code?: number })?.code;
    if (status === 404 || status === 410) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
