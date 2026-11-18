import { daysInMonth, isWeekend, toKey } from "./dates.js";

export const WEEK_START = 1; // Monday
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Build the 6x7 grid for a month, Monday-first, with adjacent-month fillers.
 * `holidayMap` is `{ "YYYY-MM-DD": { name, scope, code } }`.
 */
export function buildMonthGrid(year, month, holidayMap) {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const lead = (firstDow - WEEK_START + 7) % 7;
  const total = daysInMonth(year, month);
  const rows = Math.ceil((lead + total) / 7);
  const startDay = 1 - lead;

  const cells = [];
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
    const weekendDay = isWeekend(y, mo, dd);

    cells.push({
      key,
      year: y,
      month: mo,
      day: dd,
      inMonth,
      kind: isHoliday ? "holiday" : weekendDay ? "weekend" : "working",
      holidayName: holiday?.name,
      holidayCode: holiday?.code,
      isWorkingDay: !isHoliday && !weekendDay,
    });
  }
  return cells;
}

/** Working days (Mon-Fri, non-holiday) of a month, as sorted date keys. */
export function workingDayKeys(year, month, holidayMap) {
  return buildMonthGrid(year, month, holidayMap)
    .filter((c) => c.inMonth && c.isWorkingDay)
    .map((c) => c.key);
}
