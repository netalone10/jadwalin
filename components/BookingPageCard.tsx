"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Lang } from "@/constants/lang";
import { LANG } from "@/constants/lang";

interface BookingPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  isActive: boolean;
  accentColor: string;
}

interface BookingPageCardProps {
  page: BookingPage;
  lang: Lang;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function BookingPageCard({
  page,
  lang,
  onToggleActive,
  onDelete,
}: BookingPageCardProps) {
  const t = LANG[lang];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: page.accentColor }}
              />
              <h3 className="font-semibold text-base truncate">{page.title}</h3>
              <Badge variant={page.isActive ? "default" : "secondary"} className="flex-shrink-0">
                {page.isActive ? t.active : t.inactive}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {appUrl}/book/{page.slug}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {page.durationMinutes} {t.minutes}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href={`/pages/${page.id}/edit`}
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            {t.editPage}
          </Link>
          <Link
            href={`/book/${page.slug}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t.viewPage}
          </Link>
          <Link
            href={`/dashboard/bookings/${page.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t.viewBookings}
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleActive(page.id, !page.isActive)}
          >
            {page.isActive ? t.inactive : t.active}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm(t.cancelConfirm)) onDelete(page.id);
            }}
          >
            {t.deletePage}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
