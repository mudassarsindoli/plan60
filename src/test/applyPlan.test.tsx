import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useWfoState } from "@/hooks/useWfoState";
import { defaultState } from "@/lib/defaultState";
import { saveState } from "@/lib/storage";
import { planForStrategy } from "@/lib/optimization";

beforeEach(() => {
  window.localStorage.clear();
});

describe("applyPlan keeps neighboring months' days untouched", () => {
  it("re-planning the current month never changes the previous or next month", async () => {
    // A saved calendar where July and September already have their own days.
    const seed = {
      ...defaultState(),
      strategy: null,
      wfoDates: ["2026-07-13", "2026-07-14", "2026-08-03", "2026-08-04", "2026-09-08"],
    };
    saveState(seed);

    const { result } = renderHook(() => useWfoState());
    await waitFor(() => {
      expect(result.current.state.wfoDates).toContain("2026-08-03");
    });

    // Plan August (month-end) and apply it as if the user had hit Save.
    const plan = planForStrategy("month-end", {
      year: 2026,
      month: 7, // August (0-indexed)
      holidayMap: {},
      fixedWfo: [],
      officeCity: "Indore",
      homeCity: "Indore",
      target: 12,
    });

    act(() => {
      result.current.applyPlan(plan, 2026, 7);
    });

    const dates = result.current.state.wfoDates;

    // August was replaced wholesale by the applied plan…
    const august = dates.filter((k) => k.startsWith("2026-08")).sort();
    expect(august).toEqual([...plan.wfoCurrent].sort());

    // …while July and September keep exactly the days they already had.
    expect(dates).toContain("2026-07-13");
    expect(dates).toContain("2026-07-14");
    expect(dates.filter((k) => k.startsWith("2026-09"))).toEqual(["2026-09-08"]);
  });
});