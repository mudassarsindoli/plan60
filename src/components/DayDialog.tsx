"use client";

import { useEffect, useRef } from "react";
import { X, CalendarOff, Home, TrainFront, Bus, MapPin, Info, Check } from "lucide-react";
import { TRAVEL_KIND_META } from "@/lib/travel";
import { weekdayDate } from "@/lib/dates";
import type { TravelKind } from "@/lib/types";

interface DayDialogProps {
  open: boolean;
  onClose: () => void;
  keyName: string | null;
  cellLabel: string;
  isWorkingDay: boolean;
  isWeekend: boolean;
  isWfo: boolean;
  holidayName: string | null;
  isManualHoliday: boolean;
  markers: TravelKind[];
  onToggleWfo: () => void;
  onSetHoliday: (label: string | null) => void;
  onToggleMarker: (kind: TravelKind) => void;
}

const TRAVEL_ROWS: {
  kind: TravelKind;
  icon: typeof TrainFront;
  name: string;
  hint: string;
}[] = [
  { kind: "book-train", icon: TrainFront, name: "Book train", hint: "Rail ticket booking date" },
  { kind: "book-bus", icon: Bus, name: "Book bus", hint: "Bus ticket booking date" },
  { kind: "travel-office", icon: MapPin, name: "Travel to office", hint: "Commute / flight to office city" },
  { kind: "travel-home", icon: Home, name: "Return home", hint: "Travel back to home city" },
];

export default function DayDialog({
  open,
  onClose,
  keyName,
  cellLabel,
  isWorkingDay,
  isWeekend,
  isWfo,
  holidayName,
  isManualHoliday,
  markers,
  onToggleWfo,
  onSetHoliday,
  onToggleMarker,
}: DayDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const holidayInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || !keyName) return null;

  const saveHoliday = () => {
    const value = holidayInputRef.current?.value.trim() ?? "";
    if (value) onSetHoliday(value);
    else onSetHoliday(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-2xl outline-none scroll-soft sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {cellLabel || weekdayDate(keyName)}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {isWeekend
                ? "Weekend — never counts as a WFO day."
                : isWorkingDay
                  ? isWfo
                    ? "Marked as WFO — counts toward the 12-day target."
                    : "Eligible working day — home by default."
                  : "Holiday — never counts toward the 12-day target."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {isWorkingDay && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                onToggleWfo();
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                isWfo
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-600"
              }`}
            >
              <span>{isWfo ? "Currently WFO" : "Mark as WFO"}</span>
              {isWfo && <Check size={15} />}
            </button>
          </div>
        )}

        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <CalendarOff size={13} />
            Holiday
          </div>
          {holidayName && !isManualHoliday && (
            <p className="mt-2 flex justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
              <span>🗓 {holidayName}</span> <span className="font-normal opacity-70">Holiday</span>
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <input
              key={keyName}
              ref={holidayInputRef}
              defaultValue={isManualHoliday ? (holidayName ?? "") : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveHoliday();
              }}
              placeholder={holidayName && !isManualHoliday ? undefined : "e.g. Global sync day"}
              aria-label="Holiday name"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-indigo-500 transition-shadow placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={saveHoliday}
              className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-lime-500 hover:bg-lime-50 hover:text-lime-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              {holidayName ? "Update" : "Mark holiday"}
            </button>
            {isManualHoliday && (
              <button
                type="button"
                onClick={() => onSetHoliday(null)}
                className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-400"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            <Info size={11} />
            A holiday can never be counted as a WFO day.
          </p>
        </div>

        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Travel &amp; booking
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {TRAVEL_ROWS.map((row) => {
              const active = markers.includes(row.kind);
              const Icon = row.icon;
              return (
                <button
                  key={row.kind}
                  type="button"
                  onClick={() => onToggleMarker(row.kind)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-indigo-500 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-500/10"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <Icon size={14} className={active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"} />
                  <span className="min-w-0">
                    <span className={`block text-xs font-medium ${active ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-200"}`}>
                      {row.name}
                    </span>
                    <span className="block truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                      {TRAVEL_KIND_META[row.kind].shortLabel}
                    </span>
                  </span>
                  {active && <Check size={13} className="ml-auto text-indigo-500" />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Done
        </button>
      </div>
    </div>
  );
}