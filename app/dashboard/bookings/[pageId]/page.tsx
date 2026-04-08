"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useLang } from "@/components/LangToggle";
import { LANG } from "@/constants/lang";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface Booking {
  id: string;
  bookerName: string;
  bookerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
}

interface BookingPageInfo {
  id: string;
  title: string;
  timezone: string;
}

export default function BookingsPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [lang] = useLang();
  const t = LANG[lang];

  const [pageInfo, setPageInfo] = useState<BookingPageInfo | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    params.then(({ pageId }) => {
      Promise.all([
        fetch(`/api/booking-pages/${pageId}`).then((r) => r.json()),
        fetch(`/api/bookings?pageId=${pageId}`).then((r) => r.json()),
      ])
        .then(([page, bkgs]) => {
          if (!page.error) setPageInfo(page);
          if (Array.isArray(bkgs)) setBookings(bkgs);
        })
        .finally(() => setLoading(false));
    });
  }, [status, params]);

  const handleCancel = async (id: string) => {
    if (!confirm(t.cancelConfirm)) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
        );
      }
    } finally {
      setCancelling(null);
    }
  };

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.startTime) > now
  );
  const past = bookings.filter(
    (b) => b.status === "cancelled" || new Date(b.startTime) <= now
  );

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

  const timezone = pageInfo?.timezone ?? "Asia/Jakarta";

  const renderBookingRow = (b: Booking, showCancel: boolean) => {
    const zonedStart = toZonedTime(new Date(b.startTime), timezone);
    return (
      <div
        key={b.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl gap-3"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium">{b.bookerName}</p>
            <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
              {b.status === "confirmed" ? t.statusConfirmed : t.statusCancelled}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{b.bookerEmail}</p>
          {b.notes && <p className="text-xs text-gray-400 mt-1">{b.notes}</p>}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600 whitespace-nowrap">
            {format(zonedStart, "d MMM yyyy, HH:mm")}
          </p>
          {showCancel && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={cancelling === b.id}
              onClick={() => handleCancel(b.id)}
            >
              {cancelling === b.id ? "..." : t.cancelBtn}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold">
            {pageInfo?.title ?? t.bookingsTitle}
          </h1>
        </div>

        {/* Upcoming */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            {t.upcoming} ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noBookings}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => renderBookingRow(b, true))}
            </div>
          )}
        </div>

        {/* Past/Cancelled */}
        {past.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              {t.past} ({past.length})
            </h2>
            <div className="space-y-2 opacity-70">
              {past.map((b) => renderBookingRow(b, false))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
