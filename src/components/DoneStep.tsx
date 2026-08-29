"use client";

import {
  CheckCircle2,
  RotateCcw,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  HardDriveDownload,
} from "lucide-react";
import Dashboard from "./Dashboard";
import CalendarPreview, { type CalendarPreviewMonth } from "./CalendarPreview";
import SummaryPanel from "./SummaryPanel";
import { monthTitle } from "@/lib/dates";
import type { ReactNode } from "react";
import type { StrategyDefinition } from "@/lib/strategies";
import type { WfhPeriod } from "@/lib/workFromOffice";
import type { TravelMarker } from "@/lib/types";

interface DoneStepProps {
  year: number;
  month: number;
  used: number;
  remaining: number;
  target: number;
  longestWfh: number;
  longestFrom?: string;
  longestTo?: string;
  travelDays: number;
  strategy: StrategyDefinition | null;
  wfoDates: string[];
  invalidWfo: number;
  wfhPeriods: WfhPeriod[];
  previewMonths: CalendarPreviewMonth[];
  wfoSet: Set<string>;
  travel: Record<string, TravelMarker[]>;
  todayKey: string;
  onEditCalendar: () => void;
  onRestart: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function DoneStep({
  year,
  month,
  used,
  remaining,
  target,
  longestWfh,
  longestFrom,
  longestTo,
  travelDays,
  strategy,
  wfoDates,
  invalidWfo,
  wfhPeriods,
  previewMonths,
  wfoSet,
  travel,
  todayKey,
  onEditCalendar,
  onRestart,
  onPrevMonth,
  onNextMonth,
  onToday,
}: DoneStepProps) {
  const isComplete = used >= target;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7 dark:border-emerald-500/25 dark:bg-emerald-500/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <Kicker n={4} title="Month dashboard" />
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-emerald-950 sm:text-2xl dark:text-emerald-100">
                {isComplete
                  ? `You have ${used} office days planned for ${monthTitle(year, month)}.`
                  : `Almost there — ${remaining} more office day(s) needed.`}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-emerald-900/70 dark:text-emerald-200/70">
                {isComplete
                  ? "Everything is on the calendar. Use the controls below to review another month or edit this one."
                  : "Jump back to Step 3 to mark the remaining days."}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
            <HardDriveDownload size={12} />
            Saved to this device
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-white/70 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
          <div className="flex items-center gap-1">
            <NavButton label="Previous month" onClick={onPrevMonth}>
              <ChevronLeft size={16} />
            </NavButton>
            <span className="min-w-44 text-center text-sm font-semibold text-emerald-950 dark:text-emerald-100">
              {monthTitle(year, month)}
            </span>
            <NavButton label="Next month" onClick={onNextMonth}>
              <ChevronRight size={16} />
            </NavButton>
            <button
              type="button"
              onClick={onToday}
              className="ml-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100/80 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
            >
              <CalendarDays size={13} />
              Today
            </button>
          </div>
          <button
            type="button"
            onClick={onEditCalendar}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
          >
            <CalendarRange size={15} />
            Edit this month
          </button>
        </div>
      </div>

      <Dashboard
        used={used}
        remaining={remaining}
        target={target}
        longestWfh={longestWfh}
        longestFrom={longestFrom}
        longestTo={longestTo}
        travelDays={travelDays}
        strategyName={strategy?.name ?? "Not chosen yet"}
      />

      <CalendarPreview
        months={previewMonths}
        wfoSet={wfoSet}
        travel={travel}
        todayKey={todayKey}
      />

      <SummaryPanel
        strategy={strategy}
        wfoDates={wfoDates}
        invalidWfo={invalidWfo}
        wfhPeriods={wfhPeriods}
        travelEventCount={travelDays}
      />

      <div className="sticky bottom-4 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw size={15} />
            Reset for all months
          </button>
          <button
            type="button"
            onClick={onEditCalendar}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
          >
            <CalendarRange size={15} />
            Edit this month
          </button>
        </div>
      </div>
    </div>
  );
}

function Kicker({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white dark:bg-emerald-500">
        {n}
      </span>
      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{title}</span>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-100/80 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
    >
      {children}
    </button>
  );
}