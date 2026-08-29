import { describe, expect, it } from "vitest";
import { buildMonthGrid, workingDayKeys, WEEKDAY_LABELS } from "@/lib/calendar";
import { getHolidaysForMonths } from "@/lib/holidays";

const AUG_2026 = { year: 2026, month: 7 };

function grid(year: number, month: number, manual: Record<string, string> = {}) {
  const holidayMap = getHolidaysForMonths([{ year, month }], manual);
  return buildMonthGrid(year, month, holidayMap);
}

describe("buildMonthGrid", () => {
  it("renders a Monday-first grid with a multiple-of-7 length", () => {
    const cells = grid(AUG_2026.year, AUG_2026.month);
    expect(cells.length % 7).toBe(0);
    expect(WEEKDAY_LABELS[0]).toBe("Mon");
    // 1 Aug 2026 is a Saturday → 6th cell (Monday-first) is day 1.
    expect(cells[5].key).toBe("2026-08-01");
    expect(cells[5].weekdayIndex).toBe(5);
    expect(cells[5].kind).toBe("weekend");
  });

  it("renders a full month with leading and trailing filler cells", () => {
    const cells = grid(AUG_2026.year, AUG_2026.month);
    const inMonth = cells.filter((c) => c.inMonth);
    expect(inMonth.length).toBe(31);
    expect(cells.some((c) => !c.inMonth)).toBe(true);
  });

  it("classifies working vs weekend vs holiday correctly", () => {
    const cells = grid(AUG_2026.year, AUG_2026.month, { "2026-08-19": "Off-site" });
    const byKey = Object.fromEntries(cells.map((c) => [c.key, c]));

    expect(byKey["2026-08-03"]).toMatchObject({
      kind: "working",
      isWorkingDay: true,
      inMonth: true,
    });
    // Sat 15 Aug 2026 — Independence Day lands on a weekend: shown as a
    // holiday (never a working day, never counted toward WFO).
    expect(byKey["2026-08-15"]).toMatchObject({
      kind: "holiday",
      isWorkingDay: false,
      holidayName: "Independence Day",
    });
    // A user-marked holiday turns a working day into a holiday.
    expect(byKey["2026-08-19"]).toMatchObject({
      kind: "holiday",
      isWorkingDay: false,
      holidayName: "Off-site",
    });
    expect(byKey["2026-08-16"].kind).toBe("weekend");
  });

  it("knows that statutory holidays land on weekdays too", () => {
    // Spring 2026: Holi is Wed 25 Mar — a working day turned into a holiday.
    const cells = grid(2026, 2);
    const byKey = Object.fromEntries(cells.map((c) => [c.key, c]));
    expect(byKey["2026-03-25"]).toMatchObject({ kind: "holiday", isWorkingDay: false });
  });

  it("keeps the grid ≤ 42 cells", () => {
    expect(grid(AUG_2026.year, AUG_2026.month).length).toBe(42);
  });
});

describe("workingDayKeys", () => {
  it("excludes weekends and holidays", () => {
    const manual = { "2026-08-19": "Off-site" };
    const keys = workingDayKeys(2026, 7, getHolidaysForMonths([AUG_2026], manual));
    expect(keys).not.toContain("2026-08-15");
    expect(keys).not.toContain("2026-08-19");
    expect(keys).not.toContain("2026-08-16");
    expect(keys).toContain("2026-08-17");
    expect(keys.length).toBe(20); // 21 weekdays − 1 banked holiday
  });

  it("returns sorted keys", () => {
    const keys = workingDayKeys(2026, 7, {});
    expect([...keys].sort()).toEqual(keys);
  });
});