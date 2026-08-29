import { describe, expect, it } from "vitest";
import { addMonths } from "@/lib/dates";
import { workingDayKeys } from "@/lib/calendar";
import { getHolidaysForMonths } from "@/lib/holidays";
import {
  optimizeRemaining,
  planForStrategy,
  windowKeys,
} from "@/lib/optimization";
import type { PlanContext } from "@/lib/optimization";
import { WFO_TARGET } from "@/lib/workFromOffice";
import type { StrategyId } from "@/lib/types";

const YEAR = 2026;
const MONTH = 7; // August 2026 — 21 working days, Independence Day falls on Sat

function holidayMap(year = YEAR, month = MONTH): Record<string, string> {
  const window = [
    addMonths(year, month, -1),
    { year, month },
    addMonths(year, month, 1),
  ];
  return getHolidaysForMonths(window);
}

function ctx(fixed: string[] = [], target?: number): PlanContext {
  return {
    year: YEAR,
    month: MONTH,
    holidayMap: holidayMap(),
    fixedWfo: fixed,
    officeCity: "Pune",
    homeCity: "Mumbai",
    target,
  };
}

const working = () => workingDayKeys(YEAR, MONTH, holidayMap());
const workingSet = () => new Set(working());

describe("planForStrategy — template correctness", () => {
  const allTemplates: StrategyId[] = [
    "month-start",
    "month-end",
    "boundary",
    "maximum-wfh",
    "balanced",
  ];

  it.each(allTemplates)("%s only places days on eligible working days", (id) => {
    const plan = planForStrategy(id, ctx());
    const allowed = new Set([
      ...working(),
      ...workingDayKeys(2026, 8, holidayMap()), // next month
    ]);
    for (const key of [...plan.wfoCurrent, ...plan.wfoNext]) {
      expect(allowed.has(key)).toBe(true);
    }
  });

  it("month-start uses the first working days of the month", () => {
    const plan = planForStrategy("month-start", ctx());
    expect(plan.wfoCurrent).toEqual(working().slice(0, WFO_TARGET));
    expect(plan.wfoNext).toHaveLength(0);
  });

  it("month-end uses the last working days of the month", () => {
    const plan = planForStrategy("month-end", ctx());
    expect(plan.wfoCurrent).toEqual(
      working().slice(working().length - WFO_TARGET),
    );
  });

  it("balanced spreads picks across the month", () => {
    const plan = planForStrategy("balanced", ctx());
    expect(plan.wfoCurrent).toHaveLength(WFO_TARGET);
    expect(plan.wfoCurrent[0]).toBe(working()[0]);
    expect(plan.wfoCurrent[plan.wfoCurrent.length - 1]).toBe(
      working()[working().length - 1],
    );
  });

  it("boundary plans the tail of current + head of next month", () => {
    const plan = planForStrategy("boundary", ctx());
    expect(plan.wfoCurrent).toEqual(
      working().slice(working().length - WFO_TARGET),
    );
    expect(plan.wfoNext).toEqual(
      workingDayKeys(2026, 8, holidayMap()).slice(0, WFO_TARGET),
    );
  });

  it("maximum-wfh tops the longest-run ranking", () => {
    const candidates = [
      planForStrategy("maximum-wfh", ctx()),
      planForStrategy("month-end", ctx()),
      planForStrategy("balanced", ctx()),
      planForStrategy("boundary", ctx()),
    ];
    const runs = candidates.map((p) => p.winRun.length);
    expect(runs[0]).toBe(Math.max(...runs));
  });

  it("custom keeps the manual schedule and recalculates around it", () => {
    const plan = planForStrategy("custom", ctx(working().slice(0, 3)));
    expect(plan.wfoCurrent).toHaveLength(0);
    expect(plan.wfoNext).toHaveLength(0);
    expect(plan.explanation).toContain("manually");
  });
});

describe("optimizeRemaining", () => {
  it("keeps fixed days and fills prev/current/next to the per-month target", () => {
    const fixed = working().slice(0, 8);
    const plan = optimizeRemaining(ctx(fixed));
    const ws = workingSet();
    const prevWork = workingDayKeys(2026, 6, holidayMap());
    const nextWork = workingDayKeys(2026, 8, holidayMap());
    const prevSet = new Set(prevWork);
    const nextSet = new Set(nextWork);

    // Current month: 8 fixed + 4 more = the 12-day target.
    expect(plan.wfoCurrent).toHaveLength(4);
    expect(plan.wfoCurrent.every((k) => ws.has(k))).toBe(true);
    const total = new Set([...fixed, ...plan.wfoCurrent]);
    expect(total.size).toBe(WFO_TARGET);

    // Prev + next month each carry the full per-month target, on eligible days.
    expect(plan.wfoPrev).toHaveLength(WFO_TARGET);
    expect(plan.wfoPrev.every((k) => prevSet.has(k))).toBe(true);
    expect(plan.wfoNext).toHaveLength(WFO_TARGET);
    expect(plan.wfoNext.every((k) => nextSet.has(k))).toBe(true);
  });

  it("plans all three months even when the current month starts empty", () => {
    const plan = optimizeRemaining(ctx());
    expect(plan.wfoCurrent).toHaveLength(WFO_TARGET);
    expect(plan.wfoNext).toHaveLength(WFO_TARGET);
    expect(plan.wfoPrev).toHaveLength(WFO_TARGET);
    const allowedPrev = new Set(workingDayKeys(2026, 6, holidayMap()));
    const allowedCurrent = workingSet();
    const allowedNext = new Set(workingDayKeys(2026, 8, holidayMap()));
    for (const key of plan.wfoPrev) expect(allowedPrev.has(key)).toBe(true);
    for (const key of plan.wfoCurrent) expect(allowedCurrent.has(key)).toBe(true);
    for (const key of plan.wfoNext) expect(allowedNext.has(key)).toBe(true);
  });

  it("does not assume WFH from the 1st of the previous month", () => {
    // Planning for September: the previous month (August) must keep its target too.
    const sepCtx: PlanContext = {
      year: 2026,
      month: 8,
      holidayMap: holidayMap(2026, 8),
      fixedWfo: [],
      officeCity: "Pune",
      homeCity: "Mumbai",
      target: WFO_TARGET,
    };
    const plan = optimizeRemaining(sepCtx);
    const augWorking = new Set(workingDayKeys(2026, 7, holidayMap(2026, 8)));
    expect(plan.wfoPrev).toHaveLength(WFO_TARGET);
    expect(plan.wfoPrev.every((k) => augWorking.has(k))).toBe(true);
    // The window's first key (Aug 01) being home is fine only if it is a
    // weekend — the month itself now carries office days.
    expect(plan.wfoPrev.length).toBeGreaterThan(0);
  });

  it("unlocks a long continuous WFH run across the month boundary", () => {
    const plan = optimizeRemaining(ctx(working().slice(0, 8)));
    expect(plan.winRun.length).toBeGreaterThan(20);
    expect(plan.winRun.from).toBeDefined();
    expect(plan.winRun.to).toBeDefined();
    expect(plan.explanation).toContain("continuous WFH stretch");
  });

  it("reports infeasibility when holidays shrink the window below target", () => {
    const manual: Record<string, string> = {};
    for (let d = 1; d <= 31; d++) {
      manual[`2026-08-${String(d).padStart(2, "0")}`] = "Company shutdown";
    }
    const restrictive: PlanContext = {
      ...ctx(),
      holidayMap: getHolidaysForMonths(
        [
          addMonths(YEAR, MONTH, -1),
          { year: YEAR, month: MONTH },
          addMonths(YEAR, MONTH, 1),
        ],
        manual,
      ),
    };
    const plan = optimizeRemaining(restrictive);
    expect(plan.infeasible).toContain("Not enough eligible working days");
  });

  it("plans only next month when the current target is already met", () => {
    const plan = optimizeRemaining(ctx(working().slice(0, WFO_TARGET)));
    expect(plan.wfoCurrent).toHaveLength(0);
    expect(plan.wfoPrev).toHaveLength(WFO_TARGET);
    expect(plan.wfoNext).toHaveLength(WFO_TARGET);
    expect(plan.explanation).toContain("already met");
  });

  it("returns home only after each month's office target is complete", () => {
    const minTravel = optimizeRemaining(ctx());
    const maxWfh = optimizeRemaining(ctx(), { objective: "max-wfh" });
    // min-travel = one office stay per month (prev + current + next all hold
    // office days), and the explanation states the return-home rule.
    expect(minTravel.trips).toBe(3);
    expect(minTravel.explanation).toContain("return home only after");
    expect(maxWfh.winRun.length).toBeGreaterThanOrEqual(minTravel.winRun.length);
  });
});

describe("windowKeys", () => {
  it("spans three full months in chronological order", () => {
    const keys = windowKeys(ctx());
    expect(keys).toHaveLength(92); // Jul 31 + Aug 31 + Sep 30
    expect(keys[0]).toBe("2026-07-01");
    expect(keys[keys.length - 1]).toBe("2026-09-30");
    expect([...keys].sort()).toEqual(keys);
  });
});