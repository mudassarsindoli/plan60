"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { WEEKDAY_LABELS, type DayCell as DayCellType } from "@/lib/calendar";
import { monthTitle } from "@/lib/dates";
import type { TravelMarker } from "@/lib/types";
import DayCell from "./DayCell";

interface CalendarGridProps {
  year: number;
  month: number;
  cells: DayCellType[];
  wfoSet: Set<string>;
  travel: Record<string, TravelMarker[]>;
  proposedSet?: Set<string>;
  todayKey: string;
  onToggle: (key: string) => void;
  onOpen: (key: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function CalendarGrid({
  year,
  month,
  cells,
  wfoSet,
  travel,
  proposedSet,
  todayKey,
  onToggle,
  onOpen,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarGridProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-indigo-500 dark:text-indigo-400" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 sm:text-base dark:text-zinc-50">
            {monthTitle(year, month)}
          </h2>
        </div>

        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
        >
          Today
        </button>
      </div>

      <div className="px-2 pb-2 pt-3 sm:px-4 sm:pb-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              {label}
            </div>
          ))}
          {cells.map((cell) => (
            <DayCell
              key={cell.key}
              cell={cell}
              isWfo={wfoSet.has(cell.key)}
              isToday={cell.key === todayKey}
              isProposed={proposedSet?.has(cell.key) ?? false}
              markers={travel[cell.key] ?? []}
              onToggle={() => onToggle(cell.key)}
              onOpen={() => onOpen(cell.key)}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-100 px-1 pt-3 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <Legends
            dot="bg-indigo-600 dark:bg-indigo-500"
            label="WFO"
          />
          {proposedSet && proposedSet.size > 0 && (
            <Legends
              dot="border-2 border-dashed border-indigo-400 bg-indigo-50 dark:border-indigo-500/70"
              label="Plan preview"
            />
          )}
          <Legends dot="border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900" label="WFH" />
          <Legends dot="border border-amber-300 bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/20" label="Holiday" />
          <Legends dot="bg-zinc-200 dark:bg-zinc-700" label="Weekend" />
          {!proposedSet || proposedSet.size === 0 ? (
            <span className="text-zinc-400 dark:text-zinc-500">
              tap a working day to toggle WFO · use ⋯ for travel &amp; holidays
            </span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">
              dashed days = what your chosen strategy would place
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function Legends({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}