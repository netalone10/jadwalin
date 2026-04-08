import { google } from "googleapis";

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function getBusySlots(
  accessToken: string,
  date: string,
  timezone: string
): Promise<Array<{ start: string; end: string }>> {
  const calendar = getCalendarClient(accessToken);

  const timeMin = new Date(`${date}T00:00:00`);
  const timeMax = new Date(`${date}T23:59:59`);

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: timezone,
      items: [{ id: "primary" }],
    },
  });

  const busy = res.data.calendars?.primary?.busy ?? [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({ start: b.start!, end: b.end! }));
}

export interface CreateEventResult {
  eventId: string;
  meetLink?: string;
}

export async function createCalendarEvent(
  accessToken: string,
  {
    startTime,
    endTime,
    bookerName,
    bookerEmail,
    eventTitle,
    timezone,
    notes,
    withMeet = false,
  }: {
    startTime: string;
    endTime: string;
    bookerName: string;
    bookerEmail: string;
    eventTitle: string;
    timezone: string;
    notes?: string;
    withMeet?: boolean;
  }
): Promise<CreateEventResult> {
  const calendar = getCalendarClient(accessToken);

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: withMeet ? 1 : 0,
    requestBody: {
      summary: eventTitle,
      description: notes || undefined,
      start: { dateTime: startTime, timeZone: timezone },
      end: { dateTime: endTime, timeZone: timezone },
      ...(withMeet && {
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  });

  const meetLink =
    res.data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri ?? undefined;

  return { eventId: res.data.id!, meetLink };
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}
