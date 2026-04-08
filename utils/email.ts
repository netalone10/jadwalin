import { Resend } from "resend";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "ScheduleAI <onboarding@resend.dev>";

function formatDateTime(isoString: string, timezone: string): string {
  const zonedDate = toZonedTime(new Date(isoString), timezone);
  return format(zonedDate, "EEEE, d MMMM yyyy • HH:mm");
}

export async function sendBookingConfirmation({
  bookerEmail,
  bookerName,
  hostName,
  hostEmail,
  eventTitle,
  startTime,
  endTime,
  timezone,
}: {
  bookerEmail: string;
  bookerName: string;
  hostName: string;
  hostEmail: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  timezone: string;
}) {
  const formattedTime = formatDateTime(startTime, timezone);
  const endFormatted = format(
    toZonedTime(new Date(endTime), timezone),
    "HH:mm"
  );
  const timeDisplay = `${formattedTime} – ${endFormatted} (${timezone})`;

  const bookerHtml = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="color:#111;margin-bottom:8px">Booking Confirmed ✓</h2>
      <p style="color:#555">Hi ${bookerName}, your booking is confirmed.</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px;color:#111"><strong>${eventTitle}</strong></p>
        <p style="margin:0 0 4px;color:#555">with ${hostName}</p>
        <p style="margin:8px 0 0;color:#3B82F6;font-weight:500">${timeDisplay}</p>
      </div>
      <p style="color:#888;font-size:13px">This event has been added to ${hostName}'s calendar. Check your email calendar invite.</p>
    </div>
  `;

  const hostHtml = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="color:#111;margin-bottom:8px">New Booking: ${bookerName}</h2>
      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px;color:#111"><strong>${eventTitle}</strong></p>
        <p style="margin:0 0 4px;color:#555">Booker: ${bookerName} (${bookerEmail})</p>
        <p style="margin:8px 0 0;color:#3B82F6;font-weight:500">${timeDisplay}</p>
      </div>
    </div>
  `;

  await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: bookerEmail,
      subject: `Booking confirmed: ${eventTitle} with ${hostName}`,
      html: bookerHtml,
    }),
    resend.emails.send({
      from: FROM,
      to: hostEmail,
      subject: `New booking: ${bookerName} — ${eventTitle}`,
      html: hostHtml,
    }),
  ]);
}

export async function sendCancellationNotification({
  bookerEmail,
  bookerName,
  hostEmail,
  hostName,
  eventTitle,
  startTime,
  timezone,
}: {
  bookerEmail: string;
  bookerName: string;
  hostEmail: string;
  hostName: string;
  eventTitle: string;
  startTime: string;
  timezone: string;
}) {
  const formattedTime = formatDateTime(startTime, timezone);

  const bookerHtml = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="color:#111;margin-bottom:8px">Booking Cancelled</h2>
      <p style="color:#555">Hi ${bookerName}, your booking has been cancelled.</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px;color:#111"><strong>${eventTitle}</strong></p>
        <p style="margin:0 0 4px;color:#555">with ${hostName}</p>
        <p style="margin:8px 0 0;color:#888">${formattedTime} (${timezone})</p>
      </div>
    </div>
  `;

  const hostHtml = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="color:#111;margin-bottom:8px">Booking Cancelled: ${bookerName}</h2>
      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:24px 0">
        <p style="margin:0 0 8px;color:#111"><strong>${eventTitle}</strong></p>
        <p style="margin:0 0 4px;color:#555">Cancelled by: ${bookerName} (${bookerEmail})</p>
        <p style="margin:8px 0 0;color:#888">${formattedTime} (${timezone})</p>
      </div>
    </div>
  `;

  await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: bookerEmail,
      subject: `Booking cancelled: ${eventTitle} with ${hostName}`,
      html: bookerHtml,
    }),
    resend.emails.send({
      from: FROM,
      to: hostEmail,
      subject: `Booking cancelled: ${bookerName} — ${eventTitle}`,
      html: hostHtml,
    }),
  ]);
}
