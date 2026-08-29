import { daysInMonth, isWeekend, toKey } from "./dates";
import type { HolidayScope } from "./holidays";

export type DayKind = "working" | "weekend" | "holiday";

export interface DayCell {
  key: string;
  year: number;
  month: number;
  day: number;
  /** true when the cell belongs to the month being rendered (opposed to an adjacent-month filler). */
  inMonth: boolean;
  /** 0 = Monday … 6 = Sunday */
  weekdayIndex: number;
  kind: DayKind;
  holidayName?: string;
  /** "state" for holidays that only apply in the user's working state. */
  holidayScope?: HolidayScope;
  isWorkingDay: boolean;
}

export const WEEK_START = 1; // Monday
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Build the 6x7 grid for a month, Monday-first, with adjacent-month fillers. */
export function buildMonthGrid(
  year: number,
  month: number,
  holidayMap: Record<string, string>,
  holidayScopes: Record<string, HolidayScope> = {},
): DayCell[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const lead = (firstDow - WEEK_START + 7) % 7;
  const total = daysInMonth(year, month);
  const rows = Math.ceil((lead + total) / 7);
  const startDay = 1 - lead;

  const cells: DayCell[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const d = startDay + i;
    const date = new Date(year, month, d);
    const y = date.getFullYear();
    const mo = date.getMonth();
    const dd = date.getDate();
    const key = toKey(y, mo, dd);
    const inMonth = mo === month && d >= 1 && d <= total;
    const holiday = holidayMap[key];
    const isHoliday = Boolean(holiday);
    const isWeekendDay = isWeekend(y, mo, dd);
    const kind: DayKind = isHoliday ? "holiday" : isWeekendDay ? "weekend" : "working";

    cells.push({
      key,
      year: y,
      month: mo,
      day: dd,
      inMonth,
      weekdayIndex: (date.getDay() - WEEK_START + 7) % 7,
      kind,
      holidayName: holiday,
      holidayScope: holiday ? holidayScopes[key] : undefined,
      isWorkingDay: !isHoliday && !isWeekendDay,
    });
  }
  return cells;
}

/** Working days (Mon-Fri, non-holiday) of a month, as sorted date keys. */
export function workingDayKeys(
  year: number,
  month: number,
  holidayMap: Record<string, string>,
): string[] {
  return buildMonthGrid(year, month, holidayMap)
    .filter((c) => c.inMonth && c.isWorkingDay)
    .map((c) => c.key);
}

export function isWorkingDayKey(
  key: string,
  holidayMap: Record<string, string>,
): boolean {
  return !Object.prototype.hasOwnProperty.call(holidayMap, key) && !isWeekendISO(key);
}

function isWeekendISO(key: string): boolean {
  const parts = key.split("-").map(Number);
  if (parts.length !== 3) return false;
  return isWeekend(parts[0], parts[1] - 1, parts[2]);
}