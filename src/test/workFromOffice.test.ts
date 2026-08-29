import { describe, expect, it } from "vitest";
import {
  WFO_TARGET,
  addTravelMarker,
  countMarkers,
  countTravelDays,
  countTrips,
  countWfoForMonth,
  findWfhPeriods,
  hasMarker,
  hasWfoForMonth,
  longestWfhRun,
  officeTargetForMonth,
  rankKeys,
  remainingForMonth,
  removeTravelMarker,
} from "@/lib/workFromOffice";

const sep = () => new Set(["2026-09-01", "2026-09-02", "2026-09-03"]);

describe("WFO counting (eligibility rule)", () => {
  it("counts only WFO days on eligible working days", () => {
    const working = sep();
    const count = countWfoForMonth(
      ["2026-09-01", "2026-09-02", "2026-09-05", "2026-08-15"],
      working,
    );
    expect(count.used).toBe(2); // the two working-day picks
    expect(count.invalid).toBe(2); // weekend + out-of-month
    expect(count.target).toBe(WFO_TARGET);
    expect(count.used + count.invalid).toBe(4);
  });

  it("weekends and holidays never count toward the target", () => {
    const working = new Set(["2026-09-03"]);
    expect(countWfoForMonth(["2026-09-05"], working).used).toBe(0);
    expect(countWfoForMonth(["2026-08-15"], working).used).toBe(0);
    expect(countWfoForMonth(["2026-09-03"], working).used).toBe(1);
  });

  it("computes the remaining days to target", () => {
    const working = sep();
    expect(remainingForMonth(["2026-09-01"], working)).toBe(WFO_TARGET - 1);
    expect(remainingForMonth([], working)).toBe(WFO_TARGET);
    expect(remainingForMonth(["2026-09-01", "2026-09-02", "2026-09-03"], working)).toBe(
      WFO_TARGET - 3,
    );
  });

  it("knows whether a month has any planned office days", () => {
    expect(hasWfoForMonth(["2026-09-14"], 2026, 8)).toBe(true);
    expect(hasWfoForMonth(["2026-09-14"], 2026, 7)).toBe(false);
    expect(hasWfoForMonth([], 2026, 8)).toBe(false);
    expect(hasWfoForMonth(["2026-08-31"], 2026, 7)).toBe(true);
    expect(hasWfoForMonth(["2026-08-31"], 2026, 8)).toBe(false);
  });
});

describe("officeTargetForMonth (leaves scale the default)", () => {
  it("keeps the full 12-day default when no leaves are taken", () => {
    expect(officeTargetForMonth(22, 0)).toBe(12);
    expect(officeTargetForMonth(20, 0)).toBe(12);
    expect(officeTargetForMonth(10, 0)).toBe(10); // capped at the month's working days
  });

  it("scales the target down as leaves shrink the month", () => {
    expect(officeTargetForMonth(22, 2)).toBe(11); // round(12 × 20/22)
    expect(officeTargetForMonth(22, 11)).toBe(6); // round(12 × 11/22)
    expect(officeTargetForMonth(20, 5)).toBe(9); // round(12 × 15/20)
    expect(officeTargetForMonth(22, 21)).toBe(1); // round(12 × 1/22)
  });

  it("clamps leaves and handles empty months", () => {
    expect(officeTargetForMonth(15, 99)).toBe(1); // leaves beyond the month
    expect(officeTargetForMonth(15, -3)).toBe(12);
    expect(officeTargetForMonth(0, 0)).toBe(0);
  });
});

describe("longestWfhRun", () => {
  it("returns 0 for all-office windows", () => {
    expect(longestWfhRun([{ key: "a", isHome: false }]).length).toBe(0);
  });

  it("finds the longest home run across a window", () => {
    const days = rankKeys(
      ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"],
      new Set(["2026-08-31", "2026-09-03"]),
    );
    const run = longestWfhRun(days);
    expect(run).toEqual({
      length: 2,
      from: "2026-09-01",
      to: "2026-09-02",
    });
  });

  it("counts contiguous calendar days including weekends and holidays", () => {
    const days = rankKeys(
      [
        "2026-08-13",
        "2026-08-14",
        "2026-08-15",
        "2026-08-16",
        "2026-08-17",
        "2026-08-18",
      ],
      new Set(["2026-08-14"]),
    );
    // Home: 13,15,16,17,18 → the longest run is Sat→Mon = 15..18? No:
    // contiguous home from the 15th through the 18th = 4 days.
    expect(longestWfhRun(days).length).toBe(4);
  });
});

describe("findWfhPeriods", () => {
  it("lists maximal WFH blocks longest-first", () => {
    const days = rankKeys(
      ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06"],
      new Set(["2026-09-02", "2026-09-03"]),
    );
    const periods = findWfhPeriods(days);
    expect(periods).toEqual([
      { from: "2026-09-01", to: "2026-09-01", length: 1 },
      { from: "2026-09-04", to: "2026-09-06", length: 3 },
    ].sort((a, b) => b.length - a.length));
  });
});

describe("countTrips", () => {
  it("treats a plain weekend gap as one stay (no travel for Sat-Sun)", () => {
    const days = rankKeys(
      [
        "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
        "2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08",
      ],
      new Set([
        "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
        "2026-09-07", "2026-09-08",
      ]),
    );
    expect(countTrips(days)).toBe(1);
  });

  it("treats a 4-day long weekend as one stay (no travel unless > 4 days)", () => {
    const days = rankKeys(
      [
        "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
        "2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09",
        "2026-09-10", "2026-09-11",
      ],
      new Set([
        "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
        "2026-09-09", "2026-09-10", "2026-09-11",
      ]),
    );
    // Break Fri 09-04 → Wed 09-09 = Sat+Sun+Mon+Tue (4 days) → one stay.
    expect(countTrips(days)).toBe(1);
  });

  it("splits stays when the break is longer than 4 days", () => {
    const days = rankKeys(
      [
        "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
        "2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09",
        "2026-09-10", "2026-09-11", "2026-09-14", "2026-09-15",
      ],
      new Set([
        "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
        "2026-09-10", "2026-09-11", "2026-09-14", "2026-09-15",
      ]),
    );
    // Break Fri 09-04 → Thu 09-10 = 5 days → new travel.
    expect(countTrips(days)).toBe(2);
  });

  it("counts each isolated office day in a sparse window", () => {
    const days = rankKeys(
      ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"],
      new Set(["2026-09-01", "2026-09-02", "2026-09-04"]),
    );
    expect(countTrips(days)).toBe(1);
  });
});

describe("travel markers", () => {
  it("adds and removes markers per date", () => {
    let travel: ReturnType<typeof addTravelMarker> = {};
    travel = addTravelMarker(travel, "2026-08-23", { kind: "travel-office", label: "Go" });
    travel = addTravelMarker(travel, "2026-08-23", { kind: "book-bus", label: "Book" });
    travel = addTravelMarker(travel, "2026-09-02", { kind: "travel-home", label: "Back" });

    expect(countTravelDays(travel)).toBe(2);
    expect(hasMarker(travel, "2026-08-23", "travel-office")).toBe(true);
    expect(hasMarker(travel, "2026-08-23", "travel-home")).toBe(false);
    expect(countMarkers(travel, new Set(["2026-08-23"]))).toBe(2);

    travel = removeTravelMarker(travel, "2026-08-23", "book-bus");
    expect(countMarkers(travel, new Set(["2026-08-23"]))).toBe(1);

    travel = removeTravelMarker(travel, "2026-08-23", "travel-office");
    expect(travel["2026-08-23"]).toBeUndefined();
  });

  it("never duplicates a marker kind on the same day", () => {
    let travel: ReturnType<typeof addTravelMarker> = {};
    travel = addTravelMarker(travel, "2026-08-23", { kind: "travel-office", label: "A" });
    travel = addTravelMarker(travel, "2026-08-23", { kind: "travel-office", label: "B" });
    expect(travel["2026-08-23"].length).toBe(1);
  });
});