"use client";

import { Navbar } from "@/components/Navbar";
import { BookingPageForm } from "@/components/BookingPageForm";
import { useLang } from "@/components/LangToggle";
import { LANG } from "@/constants/lang";

export default function NewBookingPage() {
  const [lang] = useLang();
  const t = LANG[lang];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">{t.createTitle}</h1>
        <BookingPageForm lang={lang} mode="create" />
      </main>
    </div>
  );
}
