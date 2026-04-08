import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidToken } from "@/utils/token";
import { createCalendarEvent } from "@/utils/calendar";
import { parseSchedulePrompt } from "@/utils/gemini";
import { Resend } from "resend";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, timezone = "Asia/Jakarta" } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt kosong" }, { status: 400 });
  }

  let parsed: Awaited<ReturnType<typeof parseSchedulePrompt>>;

  try {
    parsed = await parseSchedulePrompt(prompt, timezone);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses prompt";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "User tidak punya email" }, { status: 404 });
  }

  let accessToken: string;

  try {
    accessToken = await getValidToken(session.userId);
  } catch {
    return NextResponse.json(
      { error: "Tidak bisa akses Google Calendar. Silakan login ulang." },
      { status: 503 }
    );
  }

  const startISO = `${parsed.date}T${parsed.startTime}:00`;
  const endISO = `${parsed.date}T${parsed.endTime}:00`;

  let googleEventId: string;
  let meetLink: string | undefined;

  try {
    const result = await createCalendarEvent(accessToken, {
      startTime: startISO,
      endTime: endISO,
      bookerName: user.name ?? "User",
      bookerEmail: user.email,
      eventTitle: parsed.title,
      timezone: parsed.timezone,
      notes: parsed.description || undefined,
      withMeet: parsed.withMeet,
    });

    googleEventId = result.eventId;
    meetLink = result.meetLink;
  } catch (err) {
    console.error("Calendar error:", err);
    return NextResponse.json(
      { error: "Gagal membuat event di Google Calendar." },
      { status: 500 }
    );
  }

  const zonedStart = toZonedTime(new Date(startISO), parsed.timezone);
  const zonedEnd = toZonedTime(new Date(endISO), parsed.timezone);

  const timeDisplay = `${format(zonedStart, "EEEE, d MMMM yyyy", {
    locale: localeId,
  })} • ${format(zonedStart, "HH:mm")} – ${format(zonedEnd, "HH:mm")} (${parsed.timezone})`;

  resend.emails
    .send({
      from: "Jadwalin <onboarding@resend.dev>",
      to: user.email,
      subject: `✅ Terjadwal: ${parsed.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#111;margin-bottom:4px">Event berhasil dijadwalkan ✓</h2>
          <p style="color:#555;margin-bottom:24px">Event berikut sudah ditambahkan ke Google Calendar kamu.</p>
          <div style="background:#f4f4f5;border-radius:10px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111">${parsed.title}</p>
            ${parsed.description ? `<p style="margin:0 0 12px;color:#555;font-size:14px">${parsed.description}</p>` : ""}
            <p style="margin:0 0 8px;color:#3B82F6;font-weight:500;font-size:14px">${timeDisplay}</p>
            ${meetLink ? `<a href="${meetLink}" style="display:inline-block;margin-top:8px;padding:8px 16px;background:#1a73e8;color:white;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500">Join Google Meet</a>` : ""}
          </div>
          <p style="color:#888;font-size:12px">Dikirim oleh Jadwalin</p>
        </div>
      `,
    })
    .catch((err) => console.error("Email error:", err));

  return NextResponse.json({
    success: true,
    event: {
      title: parsed.title,
      date: parsed.date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      description: parsed.description,
      timezone: parsed.timezone,
      googleEventId,
      meetLink: meetLink ?? null,
    },
  });
}