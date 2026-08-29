"use client";

import { ArrowRight, ArrowLeft, CheckCircle2, Home, Building2, Sparkles } from "lucide-react";
import CalendarGrid from "./CalendarGrid";
import SmartPlanner from "./SmartPlanner";
import { monthTitle, shortDate } from "@/lib/dates";
import type { DayCell as DayCellType } from "@/lib/calendar";
import type { TravelMarker } from "@/lib/types";
import type { PlanContext, PlanResult } from "@/lib/optimization";
import type { ReactNode } from "react";

interface ReviewStepProps {
  year: number;
  month: number;
  cells: DayCellType[];
  wfoSet: Set<string>;
  proposedSet: Set<string> | null;
  travel: Record<string, TravelMarker[]>;
  todayKey: string;
  plan: PlanResult | null;
  applied: boolean;
  ctx: PlanContext;
  onApplySmart: (plan: PlanResult) => void;
  onApply: () => void;
  onBack: () => void;
  onContinue: () => void;
  onToggle: (key: string) => void;
  onOpen: (key: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function ReviewStep({
  year,
  month,
  cells,
  wfoSet,
  proposedSet,
  travel,
  todayKey,
  plan,
  applied,
  ctx,
  onApplySmart,
  onApply,
  onBack,
  onContinue,
  onToggle,
  onOpen,
  onPrevMonth,
  onNextMonth,
  onToday,
}: ReviewStepProps) {
  const hasPlan = plan !== null && !plan.infeasible;
  const showPreview = hasPlan && !applied;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Kicker n={2} title="Review & fine-tune" />
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Your {monthTitle(year, month)} office days
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Dashed days are what your strategy suggests. Tap any day to add or
          remove office work, or use ⋯ for holidays and travel markers — then
          apply.
        </p>
      </div>

      <SmartPlanner ctx={ctx} applied={applied} onApply={onApplySmart} />

      {applied ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Plan applied — your days are on the calendar.
            </p>
            <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
              You can still tap days to adjust, then save to review the month.
            </p>
          </div>
        </div>
      ) : showPreview ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
            <Sparkles size={12} />
            Your plan at a glance — these days are not saved yet
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-indigo-900 dark:text-indigo-100">
            <Chip icon={Home}>
              Longest WFH: <b>{plan!.winRun.length}</b> day
              {plan!.winRun.length === 1 ? "" : "s"}
              {plan!.winRun.from != null && (
                <span className="text-indigo-700/70 dark:text-indigo-300/70">
                  {" "}
                  · {shortDate(plan!.winRun.from)} → {shortDate(plan!.winRun.to!)}
                </span>
              )}
            </Chip>
            <Chip icon={Building2}>
              {plan!.wfoCurrent.length} day
              {plan!.wfoCurrent.length === 1 ? "" : "s"} in office
              {plan!.wfoNext.length > 0 && <span> + {plan!.wfoNext.length} next month</span>}
            </Chip>
            <Chip icon={Building2}>
              {plan!.trips} office stint{plan!.trips === 1 ? "" : "s"}
            </Chip>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-xs text-zinc-500 sm:p-5 dark:border-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400">
          Nothing is saved yet. Tap working days to plan them by hand, or go
          back and pick a strategy.
        </div>
      )}

      <CalendarGrid
        year={year}
        month={month}
        cells={cells}
        wfoSet={wfoSet}
        travel={travel}
        proposedSet={showPreview ? (proposedSet ?? undefined) : undefined}
        todayKey={todayKey}
        onToggle={onToggle}
        onOpen={onOpen}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />

      <div className="sticky bottom-4 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          {showPreview ? (
            <button
              type="button"
              onClick={onApply}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
            >
              Apply plan &amp; continue
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
            >
              Save &amp; view dashboard
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Kicker({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {n}
      </span>
      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{title}</span>
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof Home; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-medium shadow-sm dark:bg-zinc-900">
      <Icon size={12} className="text-indigo-500 dark:text-indigo-400" />
      {children}
    </span>
  );
}