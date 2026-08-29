"use client";

import { CalendarCheck, Home, CalendarRange, Info } from "lucide-react";
import { shortDate, fullDate } from "@/lib/dates";
import type { StrategyDefinition } from "@/lib/strategies";
import type { WfhPeriod } from "@/lib/workFromOffice";

interface SummaryPanelProps {
  strategy: StrategyDefinition | null;
  wfoDates: string[];
  invalidWfo: number;
  wfhPeriods: WfhPeriod[];
  travelEventCount: number;
}

export default function SummaryPanel({
  strategy,
  wfoDates,
  invalidWfo,
  wfhPeriods,
  travelEventCount,
}: SummaryPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 sm:px-5 dark:border-zinc-800">
        <Info size={15} className="text-emerald-500 dark:text-emerald-400" />
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Month summary
        </h2>
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <CalendarCheck size={12} />
            WFO schedule
          </div>
          {wfoDates.length === 0 ? (
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
              No WFO days on working days yet this month.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {wfoDates.map((key) => (
                <span
                  key={key}
                  className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm dark:bg-indigo-500"
                >
                  {shortDate(key)}
                </span>
              ))}
            </div>
          )}
          {invalidWfo > 0 && (
            <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {invalidWfo} selected day(s) fall on a holiday/weekend and are not counted.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <Home size={12} />
            Continuous WFH periods
          </div>
          {wfhPeriods.length === 0 ? (
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">No WFH periods found.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {wfhPeriods.slice(0, 5).map((p) => (
                <li
                  key={p.from}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/60 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40"
                >
                  <span className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    {fullDate(p.from)} → {fullDate(p.to)}
                  </span>
                  <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {p.length}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <CalendarRange size={12} />
            Travel
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            {travelEventCount} travel event{travelEventCount === 1 ? "" : "s"} this month — markers
            appears as small badges on their day. Add or remove them from any day&apos;s
            (⋯) menu in Step 3.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
            Active strategy
          </p>
          {strategy ? (
            <>
              <p className="mt-1 text-xs font-semibold text-indigo-900 dark:text-indigo-100">
                {strategy.name}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-indigo-800/70 dark:text-indigo-200/70">
                {strategy.description}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-indigo-800/70 dark:text-indigo-200/70">
              No strategy chosen yet. Pick one in Step 2, or plan your days
              manually on the calendar.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}