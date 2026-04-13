import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ParsedEvent {
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24h)
  endTime: string;    // HH:MM (24h)
  description: string;
  timezone: string;
  withMeet: boolean;
  meetingLink: string; // external link provided by user, empty string if none
}

export async function parseSchedulePrompt(
  prompt: string,
  userTimezone: string = "Asia/Jakarta"
): Promise<ParsedEvent> {
  const now = new Date().toLocaleString("id-ID", { timeZone: userTimezone });

  const systemPrompt = `Kamu adalah asisten penjadwalan. Ekstrak informasi event dari prompt user.
Waktu sekarang: ${now} (${userTimezone})

Balas HANYA dengan JSON valid, tanpa markdown, tanpa penjelasan:
{
  "title": "judul event yang singkat dan jelas",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "description": "deskripsi singkat jika ada, kosong jika tidak ada",
  "timezone": "${userTimezone}",
  "withMeet": true atau false,
  "meetingLink": "URL meeting external jika ada, kosong jika tidak ada"
}

Aturan:
- Jika durasi tidak disebutkan, default 1 jam
- Jika waktu tidak disebutkan, gunakan 09:00
- Resolve tanggal relatif (besok, minggu depan, dll) ke tanggal absolut
- title harus dalam bahasa yang sama dengan prompt user
- Jika user menyertakan link/URL meeting (contoh: https://zoom.us/..., https://teams.microsoft.com/..., https://meet.google.com/..., atau URL meeting lainnya), AMBIL link tersebut ke meetingLink
- Jika user menyertakan link meeting external (bukan Google Meet), set meetingLink = link tersebut dan withMeet = false
- Jika user menyertakan link Google Meet, set meetingLink = link tersebut dan withMeet = false (karena sudah ada link, tidak perlu generate baru)
- withMeet = true HANYA jika prompt menyebut ingin meeting online (meet, video call, online, virtual, dll) TAPI TIDAK menyertakan link
- withMeet = false untuk reminder, deadline, event offline, atau jika link sudah disediakan user
- Jika tidak ada info event yang bisa diparse, return: {"error": "tidak bisa parse"}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(text);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return parsed as ParsedEvent;
}
