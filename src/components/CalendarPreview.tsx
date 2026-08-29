"use client";

import { CalendarDays } from "lucide-react";
import { WEEKDAY_LABELS, type DayCell as DayCellType } from "@/lib/calendar";
import { monthTitle } from "@/lib/dates";
import type { TravelMarker } from "@/lib/types";
import DayCell from "./DayCell";

export interface CalendarPreviewMonth {
  year: number;
  month: number;
  cells: DayCellType[];
}

interface CalendarPreviewProps {
  months: CalendarPreviewMonth[];
  /** Index of the highlighted "this month" panel (defaults to the center). */
  activeIndex?: number;
  wfoSet: Set<string>;
  travel: Record<string, TravelMarker[]>;
  todayKey: string;
}

const MONTH_ROLE = ["Previous month", "This month", "Next month"];

export default function CalendarPreview({
  months,
  activeIndex = 1,
  wfoSet,
  travel,
  todayKey,
}: CalendarPreviewProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays size={16} className="text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Calendar preview
        </h3>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          previous · current · next month with your office-day marks
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {months.map((m, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={`${m.year}-${m.month}`}
              className={[
                "rounded-xl border p-2.5",
                isActive
                  ? "border-indigo-300 bg-indigo-50/50 shadow-sm dark:border-indigo-500/40 dark:bg-indigo-500/5"
                  : "border-zinc-200 dark:border-zinc-800",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {monthTitle(m.year, m.month)}
                </span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                  ].join(" ")}
                >
                  {MONTH_ROLE[i] ?? `Month ${i + 1}`}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="pb-1 text-center text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                  >
                    {label}
                  </div>
                ))}
                {m.cells.map((cell) => (
                  <DayCell
                    key={cell.key}
                    cell={cell}
                    isWfo={wfoSet.has(cell.key)}
                    isToday={cell.key === todayKey}
                    markers={travel[cell.key] ?? []}
                    readOnly
                    onToggle={() => {}}
                    onOpen={() => {}}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-100 px-1 pt-3 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <Legend dot="bg-indigo-600 dark:bg-indigo-500" label="WFO" />
        <Legend dot="border border-amber-300 bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/20" label="Holiday" />
        <Legend dot="bg-zinc-200 dark:bg-zinc-700" label="Weekend" />
      </div>
    </section>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}