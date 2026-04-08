import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ParsedEvent {
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24h)
  endTime: string;    // HH:MM (24h)
  description: string;
  timezone: string;
  withMeet: boolean;  // generate Google Meet link?
}

export async function parseSchedulePrompt(
  prompt: string,
  userTimezone: string = "Asia/Jakarta"
): Promise<ParsedEvent> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
- Jika tidak ada info event yang bisa diparse, return: {"error": "tidak bisa parse"}

Prompt user: "${prompt}"`;

  const result = await model.generateContent(systemPrompt);
  const text = result.response.text().trim();

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return parsed as ParsedEvent;
}
