import { describe, expect, it } from "vitest";
import {
  HOLIDAYS,
  RECURRING_HOLIDAYS,
  STATE_HOLIDAYS,
  isKnownState,
  getHolidayName,
  getHolidaysForMonths,
  getMonthHolidays,
  getMonthHolidayScopes,
  mergeManualHolidays,
} from "@/lib/holidays";

describe("holiday master", () => {
  it("exposes an easy-to-extend stat holiday map", () => {
    expect(HOLIDAYS["2026-01-26"]).toBe("Republic Day");
    expect(HOLIDAYS["2026-08-15"]).toBe("Independence Day");
  });

  it("serves recurring holidays for any year without explicit entries", () => {
    expect(RECURRING_HOLIDAYS).toContainEqual({ month: 8, day: 15, name: "Independence Day" });
    // Explicit map lists it for 2025/2026/2027; the recurring rule covers 2028+.
    expect(getHolidayName("2028-08-15")).toBe("Independence Day");
    expect(getHolidayName("2030-12-25")).toBe("Christmas");
    expect(getHolidayName("2028-10-02")).toBe("Gandhi Jayanti");
  });

  it("returns null for non-holidays", () => {
    expect(getHolidayName("2026-08-03")).toBeNull();
    expect(getHolidayName("2026-02-30")).toBeNull();
  });

  it("lets user-marked holidays override the master", () => {
    expect(getHolidayName("2026-08-15", {})).toBe("Independence Day");
    expect(
      getHolidayName("2026-08-15", { "2026-08-15": "Team day off" }),
    ).toBe("Team day off");
  });

  it("lets users mark brand-new holidays", () => {
    const manual = { "2026-09-18": "Quarterly town-hall" };
    expect(getHolidayName("2026-09-18", manual)).toBe("Quarterly town-hall");
    expect(getHolidayName("2026-09-18")).toBeNull();
  });
});

describe("state-wise holidays", () => {
  it("activates a state's holidays only for that state", () => {
    expect(getHolidayName("2026-11-01")).toBeNull();
    expect(getHolidayName("2026-11-01", {}, "karnataka")).toBe("Kannada Rajyotsava");
    expect(getHolidayName("2026-11-01", {}, "maharashtra")).toBeNull();
  });

  it("merges the state's holidays into the monthly map", () => {
    const ka = getMonthHolidays(2026, 10, {}, "karnataka");
    expect(ka["2026-11-01"]).toBe("Kannada Rajyotsava");
    const national = getMonthHolidays(2026, 10, {});
    expect(national["2026-11-01"]).toBeUndefined();
  });

  it("spans state holidays across the optimizer window", () => {
    const map = getHolidaysForMonths(
      [{ year: 2026, month: 7 }, { year: 2026, month: 9 }, { year: 2026, month: 10 }],
      {},
      "karnataka",
    );
    expect(map["2026-11-01"]).toBe("Kannada Rajyotsava");
    expect(map["2026-10-02"]).toBe("Gandhi Jayanti");
  });

  it("tags national vs state origin so the grid can label them", () => {
    const scopes = getMonthHolidayScopes(2026, 9, {}, "karnataka");
    expect(scopes["2026-10-02"]).toBe("national");
    const kaNov = getMonthHolidayScopes(2026, 10, {}, "karnataka");
    expect(kaNov["2026-11-01"]).toBe("state");
  });

  it("keeps every pickable state in the master ledger", () => {
    expect(isKnownState("karnataka")).toBe(true);
    expect(isKnownState("delhi")).toBe(true);
    expect(isKnownState("kansas")).toBe(false);
    expect(STATE_HOLIDAYS["karnataka"]).toContainEqual({
      month: 11,
      day: 1,
      name: "Kannada Rajyotsava",
    });
  });

  it("never shadows a manual override with a state holiday", () => {
    expect(
      getHolidayName("2026-11-01", { "2026-11-01": "Company off" }, "karnataka"),
    ).toBe("Company off");
  });
});

describe("getMonthHolidays", () => {
  it("collects master, recurring and manual holidays for a month", () => {
    const result = getMonthHolidays(2026, 7, { "2026-08-19": "Off-site" });
    expect(result["2026-08-15"]).toBe("Independence Day");
    expect(result["2026-08-19"]).toBe("Off-site");
    expect(Object.keys(result).length).toBe(2);
  });

  it("fingerprints a full year of statutory holidays for August with a manual add", () => {
    const aug = getMonthHolidays(2027, 7);
    expect(aug).toEqual({ "2027-08-15": "Independence Day" });
  });
});

describe("getHolidaysForMonths", () => {
  it("spans a range of months for the optimizer window", () => {
    const map = getHolidaysForMonths([
      { year: 2026, month: 6 },
      { year: 2026, month: 7 },
      { year: 2026, month: 8 },
    ]);
    expect(map["2026-08-15"]).toBe("Independence Day");
    expect(map["2026-10-02"]).toBeUndefined();
  });

  it("applies manual holidays across the window", () => {
    const map = getHolidaysForMonths([{ year: 2026, month: 8 }], {
      "2026-09-18": "Town-hall",
    });
    expect(map["2026-09-18"]).toBe("Town-hall");
  });
});

describe("mergeManualHolidays", () => {
  it("merges seed + saved sources, user override winning", () => {
    const merged = mergeManualHolidays(
      { "2026-08-19": "Off-site" },
      { "2026-08-19": "Company off-site", "2026-08-21": "Long weekend" },
    );
    expect(merged).toEqual({
      "2026-08-19": "Company off-site",
      "2026-08-21": "Long weekend",
    });
  });

  it("removes entries mapped to empty names", () => {
    const merged = mergeManualHolidays(
      { "2026-08-19": "Off-site" },
      { "2026-08-19": "" },
    );
    expect(merged["2026-08-19"]).toBeUndefined();
  });
});