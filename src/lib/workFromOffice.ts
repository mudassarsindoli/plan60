import { daysBetween, toKey } from "./dates";
import type { TravelMarker } from "./types";

/** Required WFO days per month. */
export const WFO_TARGET = 12;

/**
 * Office days required for a month, scaled down by planned leaves:
 * target = round(WFO_TARGET × (workingDays − leaves) / workingDays),
 * never above the month's available working days.
 */
export function officeTargetForMonth(workingDays: number, leaves: number): number {
  if (workingDays <= 0) return 0;
  const leavesClamped = Math.min(workingDays - 1, Math.max(0, leaves));
  const scaled = (WFO_TARGET * (workingDays - leavesClamped)) / workingDays;
  return Math.min(workingDays, Math.max(0, Math.round(scaled)));
}

/**
 * A day ranked for streak analysis. `isHome` is true when the employee is NOT
 * required to be in the office that day (WFH, holiday or weekend).
 */
export interface RankedDay {
  key: string;
  isHome: boolean;
}

export interface WfoCount {
  /** WFO days placed on eligible (working) days of the month. */
  used: number;
  /** WFO days selected on non-eligible days (holidays/weekends) — never counted. */
  invalid: number;
  target: number;
}

export function countWfoForMonth(
  wfoDates: string[],
  workingKeys: Set<string>,
  target: number = WFO_TARGET,
): WfoCount {
  let used = 0;
  let invalid = 0;
  for (const key of wfoDates) {
    if (workingKeys.has(key)) used++;
    else invalid++;
  }
  return { used, invalid, target };
}

export function remainingForMonth(
  wfoDates: string[],
  workingKeys: Set<string>,
  target: number = WFO_TARGET,
): number {
  return Math.max(0, target - countWfoForMonth(wfoDates, workingKeys, target).used);
}

/** True when at least one office day is planned in the given month. */
export function hasWfoForMonth(
  wfoDates: string[],
  year: number,
  month: number,
): boolean {
  const prefix = toKey(year, month, 1).slice(0, 7);
  return wfoDates.some((k) => k.startsWith(prefix));
}

/**
 * Longest run of consecutive `isHome` days. Returns its length and, when it
 * exists, the inclusive start/end date keys.
 */
export function longestWfhRun(days: RankedDay[]): {
  length: number;
  from?: string;
  to?: string;
} {
  let best = 0;
  let bestFrom = "";
  let bestTo = "";
  let run = 0;
  let start = "";
  for (const d of days) {
    if (d.isHome) {
      if (run === 0) start = d.key;
      run++;
      if (run > best) {
        best = run;
        bestFrom = start;
        bestTo = d.key;
      }
    } else {
      run = 0;
    }
  }
  return best > 0 ? { length: best, from: bestFrom, to: bestTo } : { length: 0 };
}

export interface WfhPeriod {
  from: string;
  to: string;
  length: number;
}

/** All maximal continuous WFH blocks in a window, longest first. */
export function findWfhPeriods(days: RankedDay[]): WfhPeriod[] {
  const periods: WfhPeriod[] = [];
  let run = 0;
  let start = "";
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    if (d.isHome) {
      if (run === 0) start = d.key;
      run++;
      const last = i === days.length - 1;
      const next = last ? false : !days[i + 1].isHome;
      if (last || next) {
        periods.push({ from: start, to: d.key, length: run });
        run = 0;
      }
    }
  }
  return periods.sort((a, b) => b.length - a.length);
}

/**
 * Number of office "stays" in a window — i.e. the travels a commute actually
 * needs. With `splitMonths` (the minimised-travel objective) every calendar
 * month holding office days is ONE stay: you stay in the office city until the
 * month's office target is complete, then return home. Without it (max-wfh)
 * office runs separated by up to 4 calendar days stay one stay, so neighbouring
 * months can merge into a longer stretch.
 */
export function countTrips(
  days: RankedDay[],
  opts: { splitMonths?: boolean } = {},
): number {
  const splitMonths = opts.splitMonths ?? false;
  let trips = 0;
  let inStay = false;
  let lastOffice = "";
  for (const d of days) {
    if (!d.isHome) {
      if (!inStay) {
        trips++;
        inStay = true;
      } else {
        const split = splitMonths
          ? d.key.slice(0, 7) !== lastOffice.slice(0, 7)
          : daysBetween(lastOffice, d.key) - 1 > 4;
        if (split) trips++;
      }
      lastOffice = d.key;
    }
  }
  return trips;
}

/** Convert an ordered list of day keys into `RankedDay[]` given the WFO set. */
export function rankKeys(keys: string[], wfoSet: Set<string>): RankedDay[] {
  return keys.map((key) => ({ key, isHome: !wfoSet.has(key) }));
}

/** Distinct dates carrying at least one travel marker. */
export function countTravelDays(travel: Record<string, TravelMarker[]>): number {
  return Object.values(travel).filter((markers) => markers.length > 0).length;
}

export function markersForDay(
  travel: Record<string, TravelMarker[]>,
  key: string,
): TravelMarker[] {
  return travel[key] ?? [];
}

export function hasMarker(
  travel: Record<string, TravelMarker[]>,
  key: string,
  kind: string,
): boolean {
  return (travel[key] ?? []).some((m) => m.kind === kind);
}

export function addTravelMarker(
  travel: Record<string, TravelMarker[]>,
  key: string,
  marker: TravelMarker,
): Record<string, TravelMarker[]> {
  const list = travel[key] ?? [];
  if (list.some((m) => m.kind === marker.kind)) return travel;
  return { ...travel, [key]: [...list, marker] };
}

export function removeTravelMarker(
  travel: Record<string, TravelMarker[]>,
  key: string,
  kind: string,
): Record<string, TravelMarker[]> {
  const list = (travel[key] ?? []).filter((m) => m.kind !== kind);
  const next = { ...travel };
  if (list.length > 0) next[key] = list;
  else delete next[key];
  return next;
}

/** Total travel markers inside a set of day keys (used for the "Travel Days" KPI). */
export function countMarkers(
  travel: Record<string, TravelMarker[]>,
  keys: Set<string>,
): number {
  let n = 0;
  for (const key of keys) n += (travel[key] ?? []).length;
  return n;
}