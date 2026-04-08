"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BookingCalendar } from "@/components/BookingCalendar";
import { TimeSlotGrid } from "@/components/TimeSlotGrid";
import { BookingForm } from "@/components/BookingForm";
import { useLang } from "@/components/LangToggle";
import { LANG } from "@/constants/lang";
import type { TimeSlot } from "@/utils/slots";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface BookingPageConfig {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  accentColor: string;
  workingDays: number[];
  workingStart: string;
  workingEnd: string;
  timezone: string;
  hostName: string;
}

type BookingState = "calendar" | "slots" | "form" | "success";

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [lang] = useLang();
  const t = LANG[lang];

  const [config, setConfig] = useState<BookingPageConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [notFoundPage, setNotFoundPage] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [state, setState] = useState<BookingState>("calendar");
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/booking-pages/${slug}`)
      .then((r) => {
        if (!r.ok) { setNotFoundPage(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setConfig(data); })
      .finally(() => setLoadingConfig(false));
  }, [slug]);

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);
    setState("slots");
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings/slots?slug=${slug}&date=${date}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setState("form");
  };

  const handleBookingSuccess = (id: string) => {
    setBookingId(id);
    setState("success");
  };

  const handleBack = () => {
    if (state === "form") {
      setState("slots");
      setSelectedSlot(null);
    } else {
      setState("calendar");
      setSelectedDate(null);
      setSlots([]);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFoundPage || !config) return notFound();

  const accentColor = config.accentColor;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">
            {t.hostedBy} <span className="font-medium">{config.hostName}</span>
          </p>
          <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
          {config.description && (
            <p className="text-gray-600">{config.description}</p>
          )}
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span>⏱ {config.durationMinutes} {t.minutes}</span>
            <span>🌏 {config.timezone.replace("_", " ")}</span>
          </div>
        </div>

        {state === "success" ? (
          <SuccessState t={t} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Calendar */}
            <div>
              <h2 className="text-base font-semibold mb-4">{t.pickDate}</h2>
              <BookingCalendar
                workingDays={config.workingDays}
                lang={lang}
                accentColor={accentColor}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
              />
            </div>

            {/* Slots / Form */}
            {(state === "slots" || state === "form") && selectedDate && (
              <div>
                {state === "slots" ? (
                  <>
                    <h2 className="text-base font-semibold mb-4">
                      {t.pickSlot} — {formatDateDisplay(selectedDate, lang)}
                    </h2>
                    <TimeSlotGrid
                      slots={slots}
                      loading={loadingSlots}
                      lang={lang}
                      accentColor={accentColor}
                      selectedSlot={selectedSlot}
                      onSelectSlot={handleSelectSlot}
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-semibold mb-1">
                      {selectedSlot?.label}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      {formatDateDisplay(selectedDate, lang)}
                    </p>
                    <BookingForm
                      slot={selectedSlot!}
                      slug={slug}
                      lang={lang}
                      accentColor={accentColor}
                      onSuccess={handleBookingSuccess}
                      onCancel={handleBack}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDateDisplay(date: string, lang: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  return format(dateObj, "EEEE, d MMMM yyyy");
}

function SuccessState({ t }: { t: (typeof LANG)[keyof typeof LANG] }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-2">{t.successTitle}</h2>
      <p className="text-gray-600">{t.successMsg}</p>
    </div>
  );
}
