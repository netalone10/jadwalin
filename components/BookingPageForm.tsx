"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { Lang } from "@/constants/lang";
import { LANG } from "@/constants/lang";

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
];

const ACCENT_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
];

const DURATIONS = [15, 30, 45, 60];
const BUFFERS = [0, 15, 30];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface BookingPageData {
  id?: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  timezone: string;
  accentColor: string;
  workingDays: number[];
  workingStart: string;
  workingEnd: string;
}

interface BookingPageFormProps {
  lang: Lang;
  initialData?: BookingPageData;
  mode: "create" | "edit";
}

export function BookingPageForm({ lang, initialData, mode }: BookingPageFormProps) {
  const router = useRouter();
  const t = LANG[lang];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [duration, setDuration] = useState(initialData?.durationMinutes ?? 30);
  const [buffer, setBuffer] = useState(initialData?.bufferMinutes ?? 0);
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "Asia/Jakarta");
  const [accentColor, setAccentColor] = useState(initialData?.accentColor ?? "#3B82F6");
  const [workingDays, setWorkingDays] = useState<number[]>(initialData?.workingDays ?? [1, 2, 3, 4, 5]);
  const [workingStart, setWorkingStart] = useState(initialData?.workingStart ?? "09:00");
  const [workingEnd, setWorkingEnd] = useState(initialData?.workingEnd ?? "17:00");

  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from title
  useEffect(() => {
    if (mode === "create" && title) {
      setSlug(slugify(title));
    }
  }, [title, mode]);

  // Check slug uniqueness with debounce
  const checkSlug = useCallback(
    async (value: string) => {
      if (!value || value === initialData?.slug) {
        setSlugStatus("idle");
        return;
      }
      setSlugStatus("checking");
      try {
        const excludeId = initialData?.id ? `&excludeId=${initialData.id}` : "";
        const res = await fetch(`/api/booking-pages/check-slug?slug=${encodeURIComponent(value)}${excludeId}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    },
    [initialData?.id, initialData?.slug]
  );

  useEffect(() => {
    const timer = setTimeout(() => checkSlug(slug), 400);
    return () => clearTimeout(timer);
  }, [slug, checkSlug]);

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Title is required");
    if (!slug.trim()) return setError("Slug is required");
    if (slugStatus === "taken") return setError(t.slugTaken);
    if (workingDays.length === 0) return setError("Select at least one working day");

    setLoading(true);
    try {
      const payload = {
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim() || null,
        durationMinutes: duration,
        bufferMinutes: buffer,
        timezone,
        accentColor,
        workingDays,
        workingStart,
        workingEnd,
      };

      const res =
        mode === "create"
          ? await fetch("/api/booking-pages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/booking-pages/${initialData!.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t.genericError);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.pageTitle}</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.pageTitlePlaceholder}
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.pageSlug}</label>
        <Input
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder="my-booking-page"
          required
        />
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs text-gray-500">
            {t.slugHint}{appUrl}/book/{slug}
          </p>
          {slug && (
            <span
              className={`text-xs font-medium ${
                slugStatus === "available"
                  ? "text-green-600"
                  : slugStatus === "taken"
                  ? "text-red-600"
                  : "text-gray-400"
              }`}
            >
              {slugStatus === "checking"
                ? t.slugChecking
                : slugStatus === "available"
                ? `✓ ${t.slugAvailable}`
                : slugStatus === "taken"
                ? `✗ ${t.slugTaken}`
                : ""}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.pageDesc}</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.pageDescPlaceholder}
          rows={3}
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium mb-2">{t.duration}</label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                duration === d
                  ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {d} {t.minutes}
            </button>
          ))}
        </div>
      </div>

      {/* Buffer */}
      <div>
        <label className="block text-sm font-medium mb-2">{t.buffer}</label>
        <div className="flex gap-2">
          {BUFFERS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBuffer(b)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                buffer === b
                  ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {b === 0 ? t.bufferNone : `${b} ${t.minutes}`}
            </button>
          ))}
        </div>
      </div>

      {/* Working Days */}
      <div>
        <label className="block text-sm font-medium mb-2">{t.workingDays}</label>
        <div className="flex gap-2 flex-wrap">
          {t.days.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                workingDays.includes(i)
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Working Hours */}
      <div>
        <label className="block text-sm font-medium mb-2">{t.workingHours}</label>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">{t.workingStart}</label>
            <Input
              type="time"
              value={workingStart}
              onChange={(e) => setWorkingStart(e.target.value)}
              className="w-32"
            />
          </div>
          <span className="text-gray-400 mt-5">—</span>
          <div>
            <label className="text-xs text-gray-500 block mb-1">{t.workingEnd}</label>
            <Input
              type="time"
              value={workingEnd}
              onChange={(e) => setWorkingEnd(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.timezone}</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-sm font-medium mb-2">{t.accentColor}</label>
        <div className="flex gap-2 items-center">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAccentColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                accentColor === color ? "border-gray-800 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
            title="Custom color"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || slugStatus === "taken"}>
          {loading ? "..." : mode === "create" ? t.createBtn : t.saveBtn}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          {t.cancelBtn}
        </Button>
      </div>
    </form>
  );
}
