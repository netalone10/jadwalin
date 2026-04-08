"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useLang } from "@/components/LangToggle";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface ScheduledEvent {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  timezone: string;
  googleEventId: string;
  meetLink?: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang] = useLang();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScheduledEvent[]>([]);
  const [lastResult, setLastResult] = useState<ScheduledEvent | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("jadwalin_history");
    if (stored) {
      try { setHistory(JSON.parse(stored)); } catch {}
    }
  }, []);

  const saveToHistory = (event: ScheduledEvent) => {
    const updated = [event, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("jadwalin_history", JSON.stringify(updated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setError(null);
    setLastResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }

      const eventWithTime = { ...data.event, createdAt: new Date().toISOString() };
      setLastResult(eventWithTime);
      saveToHistory(eventWithTime);
      setPrompt("");
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const formatEventTime = (event: ScheduledEvent) => {
    const start = toZonedTime(
      new Date(`${event.date}T${event.startTime}:00`),
      event.timezone
    );
    return format(start, "EEEE, d MMM yyyy • HH:mm");
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">

        {/* Greeting */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Halo, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Ketik jadwal kamu, Jadwalin akan langsung simpan ke Google Calendar.
          </p>
        </div>

        {/* Prompt Input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Contoh:\n"Meeting sama Budi besok jam 3 sore"\n"Deadline laporan 20 April jam 23:59"\n"Gym setiap Senin jam 7 pagi"`}
              rows={4}
              disabled={loading}
              className="w-full px-4 pt-4 pb-2 text-sm resize-none focus:outline-none rounded-t-2xl bg-transparent placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Enter untuk kirim · Shift+Enter untuk baris baru</p>
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <span>📅</span>
                    Jadwalkan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Success Result */}
        {lastResult && (
          <div className="mb-6 px-4 py-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-gray-900">{lastResult.title}</p>
                <p className="text-sm text-green-700 mt-0.5">{formatEventTime(lastResult)}</p>
                {lastResult.description && (
                  <p className="text-xs text-gray-500 mt-1">{lastResult.description}</p>
                )}
                {lastResult.meetLink && (
                  <a
                    href={lastResult.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🎥 Join Google Meet
                  </a>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Sudah ditambahkan ke Google Calendar · Email konfirmasi dikirim
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Riwayat
            </h2>
            <div className="space-y-2">
              {history.map((event, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-3"
                >
                  <span className="text-lg mt-0.5">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatEventTime(event)}</p>
                    {event.meetLink && (
                      <a
                        href={event.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🎥 Join Meet
                      </a>
                    )}
                  </div>
                  <a
                    href="https://calendar.google.com/calendar/r"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex-shrink-0 mt-0.5"
                  >
                    Buka Calendar →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && !lastResult && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🗓</p>
            <p className="text-sm">Belum ada jadwal. Ketik sesuatu di atas!</p>
          </div>
        )}

      </main>
    </div>
  );
}
