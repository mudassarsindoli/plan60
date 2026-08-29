import { addMonths, fullDate, monthTitle, shortDate } from "./dates";
import { buildMonthGrid, workingDayKeys, type DayCell } from "./calendar";
import {
  WFO_TARGET,
  countTrips,
  countWfoForMonth,
  longestWfhRun,
  rankKeys,
} from "./workFromOffice";
import { strategyById } from "./strategies";
import type { StrategyId } from "./types";

export interface PlanResult {
  strategy: StrategyId;
  /** WFO days to set in the previous month (kept consistent during analysis). */
  wfoPrev: string[];
  /** WFO days to set in the current month. */
  wfoCurrent: string[];
  /** WFO days to set in the next month (unless the window is fully planned). */
  wfoNext: string[];
  explanation: string;
  /** Human-readable expected WFH advantage, computed from the window. */
  advantage: string;
  winRun: { length: number; from?: string; to?: string };
  trips: number;
  infeasible?: string;
}

export interface PlanContext {
  year: number;
  month: number;
  /** Combined holiday map across the evaluation window (master + manual). */
  holidayMap: Record<string, string>;
  /** WFO already committed for the current month (kept by the optimizer). */
  fixedWfo: string[];
  /** WFO already committed for the previous month (kept + filled to target). */
  fixedPrev?: string[];
  officeCity: string;
  homeCity: string;
  target?: number;
}

/** Ordered calendar cells for the evaluation window (prev, current, next month). */
export function windowCells(ctx: PlanContext): DayCell[] {
  const prev = addMonths(ctx.year, ctx.month, -1);
  const next = addMonths(ctx.year, ctx.month, 1);
  return [
    ...buildMonthGrid(prev.year, prev.month, ctx.holidayMap).filter((c) => c.inMonth),
    ...buildMonthGrid(ctx.year, ctx.month, ctx.holidayMap).filter((c) => c.inMonth),
    ...buildMonthGrid(next.year, next.month, ctx.holidayMap).filter((c) => c.inMonth),
  ];
}

export function windowKeys(ctx: PlanContext): string[] {
  return windowCells(ctx).map((c) => c.key);
}

/**
 * Frame the window fairly: any month inside the window that has no office days
 * planned yet still carries its per-month office commitment. The previous month
 * keeps a tail block in the office and the next month a head block — the same
 * pattern the app plans every month — so WFH runs only ever count real gaps.
 */
function framedSet(ctx: PlanContext, wfoSet: Set<string>): Set<string> {
  const target = Math.max(1, ctx.target ?? WFO_TARGET);
  const set = new Set<string>(wfoSet);
  const prev = addMonths(ctx.year, ctx.month, -1);
  const next = addMonths(ctx.year, ctx.month, 1);
  for (const [ym, atTail] of [
    [prev, true],
    [next, false],
  ] as const) {
    const prefix = ym.year + "-" + String(ym.month + 1).padStart(2, "0");
    if ([...set].some((k) => k.startsWith(prefix))) continue;
    const work = workingDayKeys(ym.year, ym.month, ctx.holidayMap);
    const take = Math.min(target, work.length);
    const block = atTail ? work.slice(-take) : work.slice(0, take);
    for (const d of block) set.add(d);
  }
  return set;
}

export type PlannerObjective = "min-travel" | "max-wfh";

/**
 * Compare two candidate placements. By default the plan minimizes the number of
 * office stints / travels first (you can't afford many trips in a short span),
 * then keeps the longest WFH run among equally-travel-light options. `max-wfh`
 * inverts the priority.
 */
function betterThan(
  a: { run: number; trips: number; joined: string },
  b: { run: number; trips: number; joined: string },
  objective: PlannerObjective,
): boolean {
  if (objective === "min-travel") {
    if (a.trips !== b.trips) return a.trips < b.trips;
    if (a.run !== b.run) return a.run > b.run;
    return a.joined < b.joined;
  }
  if (a.run !== b.run) return a.run > b.run;
  if (a.trips !== b.trips) return a.trips < b.trips;
  return a.joined < b.joined;
}

function metrics(ctx: PlanContext, wfoSet: Set<string>) {
  const ranked = rankKeys(windowKeys(ctx), framedSet(ctx, wfoSet));
  return {
    winRun: longestWfhRun(ranked),
    trips: countTrips(ranked),
  };
}

function planFromSet(
  ctx: PlanContext,
  strategy: StrategyId,
  wfoCurrent: string[],
  wfoNext: string[],
  hasCurrentFilled: boolean,
  wfoPrev: string[] = [],
): PlanResult {
  const all = new Set([...wfoPrev, ...wfoCurrent, ...wfoNext, ...ctx.fixedWfo]);
  const { winRun, trips } = metrics(ctx, all);
  const advantage = buildAdvantage(winRun, trips);
  const explanation = buildExplanation(
    strategy,
    hasCurrentFilled ? wfoCurrent : [],
    wfoNext,
    ctx,
  );
  return {
    strategy,
    wfoPrev: wfoPrev.slice(),
    wfoCurrent: wfoCurrent.slice(),
    wfoNext,
    explanation,
    advantage,
    winRun,
    trips,
  };
}

function buildAdvantage(
  winRun: { length: number; from?: string; to?: string },
  trips: number,
): string {
  if (winRun.length <= 0) return "No continuous WFH run in the current window.";
  return `Expected ${winRun.length}-day continuous WFH run — ${fullDate(winRun.from!)} → ${fullDate(winRun.to!)} · ${trips} office stint${trips === 1 ? "" : "s"} in this window.`;
}

function buildExplanation(
  strategy: StrategyId,
  wfoCurrent: string[],
  wfoNext: string[],
  ctx: PlanContext,
): string {
  const def = strategyById(strategy);
  const cur = wfoCurrent.map(shortDate).join(", ") || "none";
  const next = wfoNext.map(shortDate).join(", ") || "none";
  if (strategy === "custom") {
    return `Keeping your ${ctx.fixedWfo.length} manually chosen WFO day(s) — the app recalculates WFH runs and travel around them.`;
  }
  if (def.scope === "pair") {
    return `${def.name}: this month on ${cur}; next month on ${next}.`;
  }
  return `${def.name}: ${cur}.`;
}

function balancedPicks(working: string[], n: number): string[] {
  const picks: string[] = [];
  const last = working.length - 1;
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (last || 1)) / Math.max(1, n - 1));
    picks.push(working[Math.min(idx, last)]);
  }
  return picks;
}

/**
 * Candidate WFO placements for a month's working days: a single contiguous
 * block of `k` days, or two blocks hugging the month edges (first `a` + last
 * `k-a`). Edge blocks are what create long continuous WFH stretches.
 */
function blockOptions(working: string[], k: number): string[][] {
  if (k <= 0 || k > working.length) return [[]];
  const seen = new Map<string, string[]>();
  for (let s = 0; s + k <= working.length; s++) {
    const block = working.slice(s, s + k);
    seen.set(block.join(), block);
  }
  for (let a = 1; a < k; a++) {
    const b = k - a;
    const block = [...working.slice(0, a), ...working.slice(working.length - b)];
    seen.set(block.join(), block);
  }
  return [...seen.values()];
}

/**
 * Full search for the Maximum WFH plan: exhaustively compare block placements
 * across the prev + current + next month triple — each month keeps its own
 * per-month office commitment — and pick the placement with the longest
 * continuous WFH run (ties broken by fewer commutes).
 */
function searchMaximumWfh(ctx: PlanContext): {
  prev: string[];
  cur: string[];
  nxt: string[];
} | null {
  const target = ctx.target ?? WFO_TARGET;
  const prev = addMonths(ctx.year, ctx.month, -1);
  const prevWork = workingDayKeys(prev.year, prev.month, ctx.holidayMap);
  const currentWork = workingDayKeys(ctx.year, ctx.month, ctx.holidayMap);
  const next = addMonths(ctx.year, ctx.month, 1);
  const nextWork = workingDayKeys(next.year, next.month, ctx.holidayMap);
  const prevOptions = blockOptions(prevWork, Math.min(target, prevWork.length));
  const curOptions = blockOptions(currentWork, Math.min(target, currentWork.length));
  const nxtOptions = blockOptions(nextWork, Math.min(target, nextWork.length));

  const window = windowKeys(ctx);
  let best: {
    run: number;
    trips: number;
    joined: string;
    prev: string[];
    cur: string[];
    nxt: string[];
  } | null = null;

  for (const p of prevOptions) {
    for (const c of curOptions) {
      for (const n of nxtOptions) {
        const set = new Set<string>([...p, ...c, ...n]);
        const ranked = rankKeys(window, set);
        const run = longestWfhRun(ranked).length;
        const trips = countTrips(ranked);
        const joined = [...p, ...c, ...n].join();
        if (
          !best ||
          run > best.run ||
          (run === best.run && trips < best.trips) ||
          (run === best.run && trips === best.trips && joined < best.joined)
        ) {
          best = { run, trips, joined, prev: p, cur: c, nxt: n };
        }
      }
    }
  }
  if (!best) return null;
  return { prev: best.prev, cur: best.cur, nxt: best.nxt };
}

/**
 * Produce the full WFO plan for a strategy template. Pair strategies also place
 * the next month's WFO days.
 */
export function planForStrategy(
  strategy: StrategyId,
  ctx: PlanContext,
): PlanResult {
  const target = ctx.target ?? WFO_TARGET;
  const currentWork = workingDayKeys(ctx.year, ctx.month, ctx.holidayMap);
  const next = addMonths(ctx.year, ctx.month, 1);
  const nextWork = workingDayKeys(next.year, next.month, ctx.holidayMap);

  switch (strategy) {
    case "month-start":
      return planFromSet(ctx, strategy, currentWork.slice(0, target), [], true);
    case "month-end":
      return planFromSet(
        ctx,
        strategy,
        currentWork.slice(Math.max(0, currentWork.length - target)),
        [],
        true,
      );
    case "balanced":
      return planFromSet(ctx, strategy, balancedPicks(currentWork, target), [], true);
    case "boundary":
      return planFromSet(
        ctx,
        strategy,
        currentWork.slice(Math.max(0, currentWork.length - target)),
        nextWork.slice(0, target),
        true,
      );
    case "maximum-wfh": {
      const found = searchMaximumWfh(ctx);
      if (!found) return planFromSet(ctx, strategy, [], [], false);
      return planFromSet(ctx, strategy, found.cur, found.nxt, true, found.prev);
    }
    case "custom":
    default:
      return planFromSet(ctx, strategy, [], [], false);
  }
}

/**
 * Optimization engine: starting from WFO days already fixed, place the office
 * days so the PREVIOUS and CURRENT month each keep their per-month target and
 * the NEXT month gets its own target as well.
 *
 * By default (`min-travel`) each month is one office stay — you return home
 * only after that month's target of office days is complete. Among those it
 * keeps the longest continuous WFH run. Pass `objective: "max-wfh"` to
 * prioritize the run instead, letting neighbouring months merge into one
 * longer stretch. Office days only ever land on eligible working days —
 * national holidays, personal holidays and weekends never count.
 */
export function optimizeRemaining(
  ctx: PlanContext,
  options: { objective?: PlannerObjective } = {},
): PlanResult {
  const objective = options.objective ?? "min-travel";
  const target = Math.max(1, ctx.target ?? WFO_TARGET);
  const currentWork = workingDayKeys(ctx.year, ctx.month, ctx.holidayMap);
  const workingSet = new Set(currentWork);
  const fixed = ctx.fixedWfo.filter((k) => workingSet.has(k));
  const fixedSet = new Set(fixed);

  const { used } = countWfoForMonth(fixed, workingSet, target);
  const remaining = Math.max(0, target - used);
  const available = currentWork.filter((k) => !fixedSet.has(k));

  if (remaining > available.length) {
    return {
      ...planFromSet(ctx, "custom", [], [], false),
      infeasible: `Not enough eligible working days in ${monthTitle(ctx.year, ctx.month)}: ${remaining} office day(s) still required but only ${available.length} eligible day(s) left (holidays and weekends don't count).`,
    };
  }

  const prev = addMonths(ctx.year, ctx.month, -1);
  const prevWork = workingDayKeys(prev.year, prev.month, ctx.holidayMap);
  const prevWorkingSet = new Set(prevWork);
  const prevFixed = (ctx.fixedPrev ?? []).filter((k) => prevWorkingSet.has(k));
  const prevFixedSet = new Set(prevFixed);
  const prevRemaining = Math.max(0, target - prevFixedSet.size);
  const prevAvailable = prevWork.filter((k) => !prevFixedSet.has(k));
  const prevOptions =
    prevRemaining > prevAvailable.length ? [[]] : blockOptions(prevAvailable, prevRemaining);

  const next = addMonths(ctx.year, ctx.month, 1);
  const nextWork = workingDayKeys(next.year, next.month, ctx.holidayMap);
  const nextTarget = Math.min(target, nextWork.length);

  const curOptions = blockOptions(available, remaining);
  const nextOptions = blockOptions(nextWork, nextTarget);

  const window = windowKeys(ctx);
  const splitMonths = objective === "min-travel";
  let best: {
    run: number;
    trips: number;
    joined: string;
    prev: string[];
    cur: string[];
    nxt: string[];
  } | null = null;

  for (const p of prevOptions) {
    for (const c of curOptions) {
      for (const n of nextOptions) {
        const set = new Set<string>([...fixedSet, ...prevFixedSet, ...p, ...c, ...n]);
        const ranked = rankKeys(window, set);
        const run = longestWfhRun(ranked).length;
        const trips = countTrips(ranked, { splitMonths });
        const joined = [...p, ...c, ...n].join();
        const cand = { run, trips, joined, prev: p, cur: c, nxt: n };
        if (!best || betterThan(cand, best, objective)) best = cand;
      }
    }
  }

  if (!best) {
    return {
      ...planFromSet(ctx, "custom", [], [], false),
      infeasible: "Could not find a valid placement.",
    };
  }

  const wfoPrev = [...new Set([...prevFixed, ...best.prev])];
  const all = new Set<string>([...fixedSet, ...prevFixedSet, ...best.prev, ...best.cur, ...best.nxt]);
  const { winRun } = metrics(ctx, all);

  const curList = best.cur.map(shortDate).join(" · ");
  const nxtList = best.nxt.map(shortDate).join(" · ");
  const curBits =
    best.cur.length > 0 ? `add ${best.cur.length} on ${curList}` : "this month is already met";
  const objectiveNote =
    objective === "min-travel"
      ? `You stay in ${ctx.officeCity || "the office city"} for one stretch per month and return home only after the month's ${target} office day(s) are complete — ${best.trips} office stay${best.trips === 1 ? "" : "s"} across the window.`
      : `Maximizing the WFH stretch comes first — the longest run joins neighbouring months, with ${best.trips} office stay${best.trips === 1 ? "" : "s"} in the window.`;
  const explanation = `Every month keeps its ${target}-day office requirement on eligible working days (national holidays, personal holidays and weekends never count). This month: ${fixed.length + best.cur.length} day(s) — ${curBits}. Next month: ${best.nxt.length} day(s) on ${nxtList || "none"}. ${objectiveNote} The longest continuous WFH stretch is ${winRun.length} day(s) (${fullDate(winRun.from!)} → ${fullDate(winRun.to!)}).`;

  return {
    strategy: "custom",
    wfoPrev,
    wfoCurrent: best.cur,
    wfoNext: best.nxt,
    explanation,
    advantage: buildAdvantage(winRun, best.trips),
    winRun,
    trips: best.trips,
  };
}