"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TimeSlot } from "@/utils/slots";
import type { Lang } from "@/constants/lang";
import { LANG } from "@/constants/lang";

interface BookingFormProps {
  slot: TimeSlot;
  slug: string;
  lang: Lang;
  accentColor: string;
  onSuccess: (bookingId: string) => void;
  onCancel: () => void;
}

export function BookingForm({
  slot,
  slug,
  lang,
  accentColor,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const t = LANG[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Name is required");
    if (!isValidEmail(email)) return setError("Valid email is required");

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          startTime: slot.startTime,
          endTime: slot.endTime,
          bookerName: name.trim(),
          bookerEmail: email.trim().toLowerCase(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError(t.slotTaken);
        } else {
          setError(data.error ?? t.genericError);
        }
        return;
      }

      onSuccess(data.bookingId);
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t.yourName}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.yourName}
          required
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t.yourEmail}</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.yourEmail}
          required
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t.notes}</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={3}
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
          style={{ backgroundColor: accentColor, borderColor: accentColor }}
        >
          {loading ? "..." : t.confirmBtn}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t.backToCalendar}
        </Button>
      </div>
    </form>
  );
}
