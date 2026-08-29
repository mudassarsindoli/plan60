"use client";

import { useMemo, useState } from "react";
import { Sparkles, Building2, Home, Plane, Check, CalendarDays, History } from "lucide-react";
import { addMonths, fullDate, keyToYMD, monthLabel, shortDate } from "@/lib/dates";
import type { YMD } from "@/lib/dates";
import { optimizeRemaining, windowKeys } from "@/lib/optimization";
import type { PlanContext, PlanResult, PlannerObjective } from "@/lib/optimization";
import { findWfhPeriods, longestWfhRun, rankKeys } from "@/lib/workFromOffice";

interface SmartPlannerProps {
  ctx: PlanContext;
  applied: boolean;
  onApply: (plan: PlanResult) => void;
}

interface TileInfo {
  key: string;
  cls: string;
  title: string;
}

export default function SmartPlanner({ ctx, applied, onApply }: SmartPlannerProps) {
  const [objective, setObjective] = useState<PlannerObjective>("min-travel");
  const analysis = useMemo(() => {
    const plan = optimizeRemaining(ctx, { objective });
    const keys = windowKeys(ctx);
    const proposed = new Set<string>([
      ...ctx.fixedWfo,
      ...plan.wfoPrev,
      ...plan.wfoCurrent,
      ...plan.wfoNext,
    ]);
    const suggested = new Set<string>([...plan.wfoPrev, ...plan.wfoCurrent, ...plan.wfoNext]);
    const ranked = rankKeys(keys, proposed);
    const winRun = longestWfhRun(ranked);
    const periods = findWfhPeriods(ranked);

    const runSet = new Set<string>();
    if (winRun.from && winRun.to) {
      for (const k of keys) if (k >= winRun.from && k <= winRun.to) runSet.add(k);
    }

    const prevYm = addMonths(ctx.year, ctx.month, -1);
    const nextYm = addMonths(ctx.year, ctx.month, 1);
    const rows: { title: string; tiles: TileInfo[] }[] = [
      { title: monthLabel(prevYm.year, prevYm.month), tiles: [] },
      { title: monthLabel(ctx.year, ctx.month), tiles: [] },
      { title: monthLabel(nextYm.year, nextYm.month), tiles: [] },
    ];

    for (const key of keys) {
      const p = keyToYMD(key);
      if (!p) continue;
      if (p.year === prevYm.year && p.month === prevYm.month) rows[0].tiles.push(tile(key, p));
      else if (p.year === ctx.year && p.month === ctx.month) rows[1].tiles.push(tile(key, p));
      else if (p.year === nextYm.year && p.month === nextYm.month) rows[2].tiles.push(tile(key, p));
    }

    function tile(key: string, p: YMD): TileInfo {
      let cls = "bg-emerald-200 dark:bg-emerald-500/25";
      let status = "WFH";
      if (proposed.has(key)) {
        cls = suggested.has(key) ? "bg-indigo-600" : "bg-indigo-500/60";
        status = suggested.has(key) ? "Office (planned)" : "Office (already planned)";
      } else if (ctx.holidayMap[key]) {
        cls = "bg-amber-300 dark:bg-amber-500/40";
        status = "Holiday";
      } else if (isWeekendDay(p)) {
        cls = "bg-zinc-200 dark:bg-zinc-700";
        status = "Weekend";
      } else if (runSet.has(key)) {
        cls = "bg-emerald-500";
        status = "WFH — inside your longest stretch";
      }
      return { key, cls, title: `${fullDate(key)} · ${status}` };
    }

    return { plan, winRun, periods, rows, hasSuggestion: plan.wfoCurrent.length > 0 || plan.wfoNext.length > 0 };
  }, [ctx, objective]);

  const { plan, winRun, periods, rows, hasSuggestion } = analysis;
  const canApply = hasSuggestion && !plan.infeasible && !applied;
  const monthlyOffice = ctx.fixedWfo.length + plan.wfoCurrent.length;

  if (plan.infeasible) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/25 dark:bg-rose-500/10">
        <Header />
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{plan.infeasible}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-500/25 dark:bg-indigo-500/5">
      <Header />
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
        Every month keeps its office target —{" "}
        <b className="font-semibold text-indigo-700 dark:text-indigo-300">
          {rows[0]?.title}: {plan.wfoPrev.length}
        </b>
        ,{" "}
        <b className="font-semibold text-indigo-700 dark:text-indigo-300">
          {rows[1]?.title}: {monthlyOffice}
        </b>
        ,{" "}
        <b className="font-semibold text-indigo-700 dark:text-indigo-300">
          {rows[2]?.title}: {plan.wfoNext.length}
        </b>{" "}
        — only eligible working days; national holidays, personal holidays and
        weekends never count. The best possible outcome is a{" "}
        <b className="font-semibold text-emerald-700 dark:text-emerald-300">
          {winRun.length}-day continuous WFH stretch
        </b>
        {winRun.from != null && (
          <b className="font-semibold text-emerald-700 dark:text-emerald-300">
            {" "}
            — {shortDate(winRun.from)} → {shortDate(winRun.to!)}
          </b>
        )}.
      </p>

      <div className="mt-3 inline-flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setObjective("min-travel")}
          className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
            objective === "min-travel"
              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Minimum travels
        </button>
        <button
          type="button"
          onClick={() => setObjective("max-wfh")}
          className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
            objective === "max-wfh"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Maximum WFH
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat icon={Home} label="Longest WFH" value={winRun.length ? `${winRun.length} days` : "—"} tone="emerald" />
        <Stat icon={History} label="Office · prev month" value={`${plan.wfoPrev.length}`} tone="indigo" />
        <Stat icon={Building2} label="Office · this month" value={`${monthlyOffice}`} tone="indigo" />
        <Stat icon={CalendarDays} label="Office · next month" value={`${plan.wfoNext.length}`} tone="indigo" />
        <Stat icon={Plane} label="Office stints" value={`${plan.trips}`} tone="rose" />
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Your three-month plan at a glance
        </p>
        <div className="mt-2 space-y-3">
          {rows.map((row) => (
            <div key={row.title}>
              <p className="mb-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{row.title}</p>
              <div className="flex flex-wrap gap-0.5">
                {row.tiles.map((t) => (
                  <span
                    key={t.key}
                    title={t.title}
                    className={`h-3 w-3 rounded-[3px] ${t.cls}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <Swatch cls="bg-indigo-600" label="Office (planned)" />
          <Swatch cls="bg-indigo-500/60" label="Office (already planned)" />
          <Swatch cls="bg-emerald-500" label="Longest WFH" />
          <Swatch cls="bg-emerald-200 dark:bg-emerald-500/25" label="WFH" />
          <Swatch cls="bg-amber-300 dark:bg-amber-500/40" label="Holiday" />
          <Swatch cls="bg-zinc-200 dark:bg-zinc-700" label="Weekend" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Planned office days — {rows[0]?.title}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {plan.wfoPrev.length > 0 ? (
              plan.wfoPrev.map((key) => (
                <span
                  key={key}
                  className="rounded-md bg-indigo-500/70 px-2 py-1 text-[11px] font-semibold text-white dark:bg-indigo-400/80"
                >
                  {shortDate(key)}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                No office days required.
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Where you should be at the office — {rows[1]?.title}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {plan.wfoCurrent.length > 0 ? (
              plan.wfoCurrent.map((key) => (
                <span
                  key={key}
                  className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm shadow-indigo-600/30 dark:bg-indigo-500"
                >
                  {shortDate(key)}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                You already have {ctx.fixedWfo.length} office day(s) — this month is met.
              </span>
            )}
          </div>
        </div>

        {plan.wfoNext.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              And {rows[2]?.title} — be at the office on
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {plan.wfoNext.map((key) => (
                <span
                  key={key}
                  className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm shadow-indigo-600/30 dark:bg-indigo-500"
                >
                  {shortDate(key)}
                </span>
              ))}
            </div>
          </div>
        )}

        {winRun.from != null && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
              <Home size={12} />
              Be back home from{" "}
              <b>{winRun.from != null ? shortDate(winRun.from) : "—"}</b> and stay WFH through{" "}
              <b>{winRun.to != null ? shortDate(winRun.to) : "—"}</b>
            </p>
          </div>
        )}

        {periods.length > 1 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Every WFH stretch
            </p>
            <ul className="mt-1.5 grid grid-cols-1 gap-1 text-[11px] text-zinc-600 sm:grid-cols-2 dark:text-zinc-300">
              {periods.slice(0, 4).map((p) => (
                <li key={p.from} className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 dark:bg-zinc-900/40">
                  <span className="truncate">
                    {shortDate(p.from)} → {shortDate(p.to)}
                  </span>
                  <b className="shrink-0 text-emerald-600 dark:text-emerald-400">{p.length}d</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {canApply && (
        <button
          type="button"
          onClick={() => onApply(plan)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-500"
        >
          <Check size={15} />
          Adopt this smart schedule
        </button>
      )}
      {applied && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
          <Check size={15} />
          Smart schedule adopted — adjust any day on the calendar
        </p>
      )}
    </section>
  );
}

function Header() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-emerald-500 dark:text-emerald-400" />
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Smart planner
        </h3>
        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          auto-analysed
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        Optimizes your office days across the previous, current, and next month.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  tone: "emerald" | "indigo" | "sky" | "rose";
}) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    sky: "text-sky-600 dark:text-sky-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <Icon size={13} className={tones[tone]} />
      <p className="mt-1 text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function Swatch({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-[3px] ${cls}`} />
      {label}
    </span>
  );
}

function isWeekendDay(p: { year: number; month: number; day: number }): boolean {
  const dow = new Date(p.year, p.month, p.day).getDay();
  return dow === 0 || dow === 6;
}