import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  compareKeys,
  dateToKey,
  daysInMonth,
  fullDate,
  isWeekend,
  keyToDate,
  keyToYMD,
  monthTitle,
  shortDate,
  toKey,
} from "@/lib/dates";

describe("toKey / parse round-trips", () => {
  it("pads month and day", () => {
    expect(toKey(2026, 7, 9)).toBe("2026-08-09");
    expect(toKey(2026, 0, 5)).toBe("2026-01-05");
    expect(toKey(2026, 11, 31)).toBe("2026-12-31");
  });

  it("parses a valid key", () => {
    expect(keyToYMD("2026-08-15")).toEqual({ year: 2026, month: 7, day: 15 });
  });

  it("rejects malformed keys", () => {
    expect(keyToYMD("2026-13-01")).toBeNull();
    expect(keyToYMD("15-08-2026")).toBeNull();
    expect(keyToYMD("garbage")).toBeNull();
  });

  it("keyToDate builds a local Date", () => {
    const d = keyToDate("2026-08-15");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(7);
    expect(d!.getDate()).toBe(15);
  });

  it("dateToKey round-trips", () => {
    expect(dateToKey(new Date(2026, 7, 15, 20, 30))).toBe("2026-08-15");
  });
});

describe("addDays", () => {
  it("handles month rollover", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-08-01", -1)).toBe("2026-07-31");
  });

  it("crosses year boundaries", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("calendar math helpers", () => {
  it("knows days in each month", () => {
    expect(daysInMonth(2026, 0)).toBe(31);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2028, 1)).toBe(29); // leap year
    expect(daysInMonth(2026, 7)).toBe(31);
    expect(daysInMonth(2026, 8)).toBe(30);
  });

  it("flags weekends", () => {
    expect(isWeekend(2026, 7, 1)).toBe(true); // Sat 1 Aug
    expect(isWeekend(2026, 7, 2)).toBe(true); // Sun 2 Aug
    expect(isWeekend(2026, 7, 3)).toBe(false); // Mon 3 Aug
    expect(isWeekend(2026, 7, 15)).toBe(true); // Sat 15 Aug
  });

  it("shifts months while clamping the day", () => {
    expect(addMonths(2026, 7, 1)).toEqual({ year: 2026, month: 8 });
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("sorts date keys chronologically", () => {
    expect(compareKeys("2026-08-01", "2026-08-29")).toBeLessThan(0);
    expect(compareKeys("2026-08-29", "2026-08-01")).toBeGreaterThan(0);
    expect(compareKeys("2026-08-01", "2026-08-01")).toBe(0);
  });
});

describe("human-readable formatting", () => {
  it("formats month titles", () => {
    expect(monthTitle(2026, 7)).toBe("August 2026");
    expect(monthTitle(2027, 0)).toBe("January 2027");
  });

  it("formats short and full dates", () => {
    expect(shortDate("2026-08-24")).toBe("24 Aug");
    expect(fullDate("2026-12-25")).toBe("25 Dec 2026");
  });
});