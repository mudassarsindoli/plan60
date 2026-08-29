"use client";

import { useState } from "react";
import { ArrowRight, Minus, Plus, CalendarDays, CalendarOff, Building2, MapPin } from "lucide-react";
import { monthTitle } from "@/lib/dates";
import { officeTargetForMonth } from "@/lib/workFromOffice";
import { HOLIDAY_STATES } from "@/lib/holidays";
import type { StateId } from "@/lib/holidays";

interface SetupStepProps {
  year: number;
  month: number;
  /** Planned leaves this month — shrinks the office-day requirement. */
  leaves: number;
  /** Number of eligible working days in the picked month (holidays excluded). */
  workingDays: number;
  /** Working state — drives which state-wise holidays apply alongside national ones. */
  state: StateId | null;
  onMonthChange: (year: number, month: number) => void;
  onLeavesChange: (leaves: number) => void;
  onStateChange: (id: StateId | null) => void;
  onContinue: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function SetupStep({
  year,
  month,
  leaves,
  workingDays,
  state,
  onMonthChange,
  onLeavesChange,
  onStateChange,
  onContinue,
}: SetupStepProps) {
  const [monthInput, setMonthInput] = useState(`${year}-${pad(month + 1)}`);
  const maxLeaves = Math.max(0, workingDays - 1);
  const officeDays = officeTargetForMonth(workingDays, leaves);
  const isValidTarget = officeDays > 0;

  const commitMonth = (value: string) => {
    setMonthInput(value);
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return;
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    if (m >= 0 && m <= 11) onMonthChange(y, m);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="px-4 pb-2 pt-6 sm:px-7 sm:pt-8">
        <Kicker n={1} title="Set up your plan" />
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Which month and how many office days?
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Tell us the month you&apos;re planning and how many days you must work
          from the office. Everything after this adapts to your numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-7">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <CalendarDays size={13} className="text-indigo-500 dark:text-indigo-400" />
            Month
          </div>
          <div className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {monthTitle(year, month)}
          </div>
          <input
            type="month"
            value={monthInput}
            onChange={(e) => commitMonth(e.target.value)}
            aria-label="Planning month"
            className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-indigo-500 transition-shadow focus:border-indigo-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {workingDays} eligible working day{workingDays === 1 ? "" : "s"} in{" "}
            {monthTitle(year, month)} — weekends and holidays stay home automatically.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <CalendarOff size={13} className="text-indigo-500 dark:text-indigo-400" />
            Planned leaves
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLeavesChange(Math.max(0, leaves - 1))}
              disabled={leaves <= 0}
              aria-label="Decrease leaves"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              <Minus size={15} />
            </button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {leaves}
              </span>
              <span className="ml-1 text-xs text-zinc-400">leaves</span>
            </div>
            <button
              type="button"
              onClick={() => onLeavesChange(Math.min(maxLeaves, leaves + 1))}
              disabled={leaves >= maxLeaves}
              aria-label="Increase leaves"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              <Plus size={15} />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
            {leaves === 0
              ? "No leaves — your full month is available for work."
              : leaves >= maxLeaves
                ? "Every possible working day is on leave."
                : `You'll take ${leaves} leave day${leaves === 1 ? "" : "s"} in ${monthTitle(year, month)}.`}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4 sm:col-span-2 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <MapPin size={13} className="text-indigo-500 dark:text-indigo-400" />
            Working state
          </div>
          <select
            value={state ?? ""}
            onChange={(e) => onStateChange(e.target.value || null)}
            aria-label="Working state for holidays"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-indigo-500 transition-shadow focus:border-indigo-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">National holidays only</option>
            {HOLIDAY_STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {state ? (
              <>
                State holidays for{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {HOLIDAY_STATES.find((s) => s.id === state)?.name ?? state}
                </span>{" "}
                are added to the national list — e.g. Kannada Rajyotsava (Nov 1) only
                counts for Karnataka. Marked as • on the calendar.
              </>
            ) : (
              "Only national holidays count as off days. Pick a state to include its regional holidays."
            )}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:col-span-2 sm:flex-row sm:items-center dark:border-indigo-500/25 dark:bg-indigo-500/10">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <Building2 size={16} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                Office days needed
              </p>
              <p className="mt-1 text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                {isValidTarget ? officeDays : 0} day{officeDays === 1 ? "" : "s"} in the office
                <span className="text-sm font-medium text-indigo-700/70 dark:text-indigo-300/70">
                  {" "}
                  of {workingDays} working day{workingDays === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>
          <p className="max-w-xs text-[11px] leading-relaxed text-indigo-800/70 dark:text-indigo-200/70">
            12 × ({workingDays} working days − {leaves} leaves) ÷ {workingDays} = {officeDays}
          </p>
        </div>
      </div>

      <div className="flex justify-end border-t border-zinc-100 px-4 py-4 sm:px-7 dark:border-zinc-800">
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValidTarget}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          See the next steps
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
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