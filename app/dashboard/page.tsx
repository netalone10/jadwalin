"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BookingPageCard } from "@/components/BookingPageCard";
import { useLang } from "@/components/LangToggle";
import { LANG } from "@/constants/lang";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface BookingPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  isActive: boolean;
  accentColor: string;
}

interface Booking {
  id: string;
  bookerName: string;
  bookerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  bookingPage: { title: string; timezone: string };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang] = useLang();
  const t = LANG[lang];

  const [pages, setPages] = useState<BookingPage[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchPages();
    fetchUpcomingBookings();
  }, [status]);

  const fetchPages = async () => {
    setLoadingPages(true);
    try {
      const res = await fetch("/api/booking-pages");
      if (res.ok) setPages(await res.json());
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchUpcomingBookings = async () => {
    // Fetch from all pages — we'll aggregate on the client
    const res = await fetch("/api/bookings/upcoming");
    if (res.ok) setUpcomingBookings(await res.json());
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/booking-pages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive } : p))
    );
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/booking-pages/${id}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.id !== id));
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Booking Pages */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t.dashboardTitle}</h1>
          <Link href="/pages/new" className={cn(buttonVariants({ variant: "default" }))}>
            {t.newPage}
          </Link>
        </div>

        {loadingPages ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 mb-4">{t.noPages}</p>
            <Link href="/pages/new" className={cn(buttonVariants({ variant: "default" }))}>
              {t.newPage}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <BookingPageCard
                key={page.id}
                page={page}
                lang={lang}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Upcoming Bookings */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">{t.upcomingBookings}</h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-500 text-sm">{t.noBookings}</p>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((b) => {
                const zonedStart = toZonedTime(
                  new Date(b.startTime),
                  b.bookingPage.timezone
                );
                return (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl gap-2"
                  >
                    <div>
                      <p className="font-medium">{b.bookerName}</p>
                      <p className="text-sm text-gray-500">{b.bookingPage.title}</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(zonedStart, "d MMM yyyy, HH:mm")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
