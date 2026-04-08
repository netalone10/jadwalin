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
  "withMeet": true atau false
}

Aturan:
- Jika durasi tidak disebutkan, default 1 jam
- Jika waktu tidak disebutkan, gunakan 09:00
- Resolve tanggal relatif (besok, minggu depan, dll) ke tanggal absolut
- title harus dalam bahasa yang sama dengan prompt user
- withMeet = true jika prompt menyebut: meet, google meet, video call, online, zoom, virtual, meeting online, panggilan video, atau sejenisnya
- withMeet = false untuk reminder, deadline, atau event offline
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
