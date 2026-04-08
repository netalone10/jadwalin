"use client";

import type { TimeSlot } from "@/utils/slots";
import type { Lang } from "@/constants/lang";
import { LANG } from "@/constants/lang";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  loading: boolean;
  lang: Lang;
  accentColor: string;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export function TimeSlotGrid({
  slots,
  loading,
  lang,
  accentColor,
  selectedSlot,
  onSelectSlot,
}: TimeSlotGridProps) {
  const t = LANG[lang];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">{t.noSlots}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.startTime === slot.startTime;
        return (
          <button
            key={slot.startTime}
            onClick={() => onSelectSlot(slot)}
            className={`
              px-2 py-2.5 rounded-lg text-sm font-medium border transition-colors
              ${isSelected
                ? "text-white border-transparent"
                : "border-gray-200 hover:border-gray-400 text-gray-800"
              }
            `}
            style={isSelected ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
