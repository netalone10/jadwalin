"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BookingPageForm } from "@/components/BookingPageForm";
import { useLang } from "@/components/LangToggle";
import { LANG } from "@/constants/lang";

interface BookingPageData {
  id: string;
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

export default function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [lang] = useLang();
  const t = LANG[lang];
  const [pageData, setPageData] = useState<BookingPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    params.then(({ id }) => {
      fetch(`/api/booking-pages/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) { router.push("/dashboard"); return; }
          setPageData(data);
        })
        .finally(() => setLoading(false));
    });
  }, [status, params, router]);

  if (loading) {
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">{t.editTitle}</h1>
        {pageData && (
          <BookingPageForm lang={lang} initialData={pageData} mode="edit" />
        )}
      </main>
    </div>
  );
}
