"use client";

import { ArrowRight, Check, Home, Building2 } from "lucide-react";
import { STRATEGIES } from "@/lib/strategies";
import type { StrategyId } from "@/lib/types";
import type { PlanResult } from "@/lib/optimization";
import { shortDate } from "@/lib/dates";

interface PlanStepProps {
  selected: StrategyId | null;
  target: number;
  onSelect: (id: StrategyId) => void;
  plan: PlanResult | null;
  onContinue: () => void;
  onManual: () => void;
}

export default function PlanStep({
  selected,
  target,
  onSelect,
  plan,
  onContinue,
  onManual,
}: PlanStepProps) {
  const isCustom = selected === "custom";
  const showPreview = !isCustom && target > 0 && plan !== null && !plan.infeasible;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="px-4 pb-4 pt-5 sm:px-7 sm:pt-7">
        <StepKicker n={1} title="Choose your approach" />
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          How do you want to handle your {target} office days?
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Pick a strategy and we&apos;ll suggest exactly which working days to
          spend in the office. Pick one — you can fine-tune any day on the next
          screen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 px-4 pb-2 sm:grid-cols-2 sm:px-7 sm:pb-4">
        {STRATEGIES.map((s) => {
          const active = s.id === selected;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-pressed={active}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-500/10"
                  : "border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-indigo-600 dark:hover:bg-zinc-800/50"
              }`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      active ? "text-indigo-800 dark:text-indigo-200" : "text-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    {s.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    {s.tagline}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {s.description}
                  </span>
                </span>
                {active && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check size={12} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {showPreview && (
        <div className="mx-4 mb-2 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:mx-7 dark:border-indigo-500/25 dark:bg-indigo-500/10">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
            With this strategy
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-indigo-900 dark:text-indigo-100">
            <PlanChip icon={Home}>
              Longest WFH: <b>{plan!.winRun.length}</b> days
              {plan!.winRun.from != null && (
                <span className="text-indigo-700/70 dark:text-indigo-300/70">
                  {" "}
                  · {shortDate(plan!.winRun.from)} → {shortDate(plan!.winRun.to!)}
                </span>
              )}
            </PlanChip>
            <PlanChip icon={Building2}>
              {plan!.wfoCurrent.length} office day
              {plan!.wfoCurrent.length === 1 ? "" : "s"} this month
              {plan!.wfoNext.length > 0 && <span> + {plan!.wfoNext.length} next month</span>}
            </PlanChip>
            <PlanChip icon={Building2}>
              {plan!.trips} office stint{plan!.trips === 1 ? "" : "s"} in the window
            </PlanChip>
          </div>
        </div>
      )}

      {isCustom && (
        <div className="mx-4 mb-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 sm:mx-7 dark:border-zinc-600 dark:bg-zinc-800/40">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Nothing is placed automatically — head to the calendar and tap the
            days you want to work from the office. We&apos;ll still track your
            target and your longest WFH run.
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse items-stretch gap-2 border-t border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-zinc-800">
        <button
          type="button"
          onClick={onManual}
          className="rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          Skip — I&apos;ll mark days myself
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selected || target === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          See my plan
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}

function StepKicker({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {n}
      </span>
      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{title}</span>
    </div>
  );
}

function PlanChip({ icon: Icon, children }: { icon: typeof Home; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-medium shadow-sm dark:bg-zinc-900">
      <Icon size={12} className="text-indigo-500 dark:text-indigo-400" />
      {children}
    </span>
  );
}