"use client";

import {
  Building2,
  CalendarRange,
  TrendingUp,
  Home,
} from "lucide-react";
import { shortDate } from "@/lib/dates";

interface DashboardProps {
  used: number;
  remaining: number;
  target: number;
  longestWfh: number;
  longestFrom?: string;
  longestTo?: string;
  travelDays: number;
  strategyName: string;
}

function ProgressRing({
  used,
  target,
  size = 64,
}: {
  used: number;
  target: number;
  size?: number;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, used / target) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="stroke-indigo-600 transition-all duration-500 dark:stroke-indigo-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {Math.round(pct * 100)}%
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({
  used,
  remaining,
  target,
  longestWfh,
  longestFrom,
  longestTo,
  travelDays,
  strategyName,
}: DashboardProps) {
  const done = used >= target;

  const wfhLabel =
    longestWfh > 0 && longestFrom && longestTo
      ? `${shortDate(longestFrom)} → ${shortDate(longestTo)}`
      : "No WFH run yet";

  return (
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ProgressRing used={used} target={target} />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            WFO
          </p>
          <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {used} <span className="text-sm font-medium text-zinc-400">/ {target}</span>
          </p>
          <p className={`text-[11px] ${done ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>
            {done ? "Target met" : "Target for this month"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Home size={14} />
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Remaining
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {remaining}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          eligible working days to mark
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <TrendingUp size={14} />
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Longest WFH
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {longestWfh}
          <span className="text-sm font-medium text-zinc-400"> days</span>
        </p>
        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{wfhLabel}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
          <CalendarRange size={14} />
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Travel days
          </p>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {travelDays}
        </p>
        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
          days with a travel event this month
        </p>
      </div>

      <div className="col-span-2 flex items-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-2.5 shadow-sm lg:col-span-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Building2 size={13} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          Active strategy ·{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{strategyName}</span>
        </p>
      </div>
    </section>
  );
}