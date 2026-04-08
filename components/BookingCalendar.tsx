"use client";

import { useState } from "react";
import type { Lang } from "@/constants/lang";
import { LANG } from "@/constants/lang";

interface BookingCalendarProps {
  workingDays: number[];
  lang: Lang;
  accentColor: string;
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}

export function BookingCalendar({
  workingDays,
  lang,
  accentColor,
  onSelectDate,
  selectedDate,
}: BookingCalendarProps) {
  const t = LANG[lang];
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const isDisabled = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isWorkingDay = workingDays.includes(date.getDay());
    return isPast || !isWorkingDay;
  };

  const formatDate = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ←
        </button>
        <span className="font-medium text-sm">
          {t.months[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-gray-100"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {t.days.map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateStr = formatDate(day);
          const disabled = isDisabled(day);
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={day}
              onClick={() => !disabled && onSelectDate(dateStr)}
              disabled={disabled}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-full mx-auto w-8 h-8
                transition-colors
                ${disabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"}
                ${isSelected ? "text-white font-medium" : ""}
              `}
              style={isSelected ? { backgroundColor: accentColor } : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
