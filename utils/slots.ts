import { toZonedTime, fromZonedTime } from "date-fns-tz";

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  label: string;     // "09:00 – 09:30"
}

interface BusySlot {
  start: string;
  end: string;
}

interface CalculateOptions {
  workingStart: string;    // "09:00"
  workingEnd: string;      // "17:00"
  workingDays: number[];   // [1,2,3,4,5]
  durationMinutes: number;
  bufferMinutes: number;
  busySlots: BusySlot[];
  date: string;            // "2026-04-08"
  timezone: string;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m };
}

function formatLabel(date: Date, timezone: string): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
}

export function calculateAvailableSlots({
  workingStart,
  workingEnd,
  workingDays,
  durationMinutes,
  bufferMinutes,
  busySlots,
  date,
  timezone,
}: CalculateOptions): TimeSlot[] {
  // Parse the date in the host's timezone
  const [year, month, day] = date.split("-").map(Number);

  // Check working day (0=Sun, 1=Mon, ..., 6=Sat)
  const testDate = new Date(year, month - 1, day);
  const dayOfWeek = testDate.getDay();
  if (!workingDays.includes(dayOfWeek)) return [];

  const { hours: startHour, minutes: startMin } = parseTime(workingStart);
  const { hours: endHour, minutes: endMin } = parseTime(workingEnd);

  // Generate all possible slots
  const slots: TimeSlot[] = [];
  const stepMinutes = durationMinutes + bufferMinutes;
  const now = new Date();

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStartH = Math.floor(currentMinutes / 60);
    const slotStartM = currentMinutes % 60;

    // Build slot start/end in the host's timezone
    const slotStartLocal = new Date(
      year,
      month - 1,
      day,
      slotStartH,
      slotStartM,
      0,
      0
    );
    const slotStart = fromZonedTime(slotStartLocal, timezone);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

    // Skip past slots (add 1 min buffer so current minute shows)
    if (slotStart.getTime() > now.getTime() + 60 * 1000) {
      // Check overlap with busy slots (including buffer after)
      const bufferedEnd = new Date(
        slotEnd.getTime() + bufferMinutes * 60 * 1000
      );
      const bufferedStart = new Date(
        slotStart.getTime() - bufferMinutes * 60 * 1000
      );

      const overlaps = busySlots.some((busy) => {
        const busyStart = new Date(busy.start).getTime();
        const busyEnd = new Date(busy.end).getTime();
        return (
          bufferedStart.getTime() < busyEnd &&
          bufferedEnd.getTime() > busyStart
        );
      });

      if (!overlaps) {
        const zonedStart = toZonedTime(slotStart, timezone);
        const zonedEnd = toZonedTime(slotEnd, timezone);
        const startLabel = formatLabel(zonedStart, timezone);
        const endLabel = formatLabel(zonedEnd, timezone);

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          label: `${startLabel} – ${endLabel}`,
        });
      }
    }

    currentMinutes += stepMinutes;
  }

  return slots;
}
