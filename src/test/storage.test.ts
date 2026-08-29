import { beforeEach, describe, expect, it } from "vitest";
import {
  clearState,
  loadState,
  loadView,
  normalize,
  saveState,
  saveView,
} from "@/lib/storage";
import { defaultState } from "@/lib/defaultState";
import { STORAGE_KEY, VIEW_KEY } from "@/lib/types";

beforeEach(() => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(VIEW_KEY);
});

describe("storage persistence", () => {
  it("returns null when nothing is stored yet", () => {
    expect(loadState()).toBeNull();
  });

  it("round-trips the full app state", () => {
    const state = defaultState();
    saveState(state);
    const loaded = loadState();
    expect(loaded).toEqual(state);
  });

  it("survives a reload cycle with user edits", () => {
    const edited = {
      ...defaultState(),
      wfoDates: ["2026-09-01", "2026-09-02"],
      strategy: "month-end" as const,
      officeCity: "Bengaluru",
      manualHolidays: { "2026-09-10": "Diwali" },
      leavesByMonth: { "2026-08": 3, "2026-10-15": 2, "2026-09": 40 },
      state: "karnataka",
    };
    saveState(edited);
    const loaded = loadState();
    expect(loaded).toMatchObject({
      wfoDates: ["2026-09-01", "2026-09-02"],
      strategy: "month-end",
      officeCity: "Bengaluru",
      manualHolidays: { "2026-09-10": "Diwali" },
      leavesByMonth: { "2026-08": 3, "2026-10-15": 2, "2026-09": 31 },
      state: "karnataka",
      version: 1,
    });
  });

  it("drops unknown travel kinds but keeps valid markers", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...defaultState(),
        travel: {
          "2026-08-23": [
            { kind: "travel-office", label: "Go" },
            { kind: "spaceship", label: "To mars" },
          ],
        },
      }),
    );
    const loaded = loadState();
    expect(loaded?.travel["2026-08-23"]).toEqual([
      { kind: "travel-office", label: "Go" },
    ]);
  });

  it("falls back to a clean state for corrupt data", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadState()).toBeNull();
  });

  it("normalize fills missing fields from the default state", () => {
    const partial = normalize({ wfoDates: ["2026-08-19"] });
    expect(partial).not.toBeNull();
    expect(partial!.wfoDates).toContain("2026-08-19");
    expect(partial!.officeCity).toBe("");
    expect(partial!.strategy).toBeNull();
    expect(partial!.version).toBe(1);
  });

  it("normalize rejects garbage input", () => {
    expect(normalize(null)).toBeNull();
    expect(normalize("hi")).toBeNull();
    expect(normalize([1, 2])).toBeNull();
  });

  it("clearState wipes the persisted blob", () => {
    saveState(defaultState());
    expect(loadState()).not.toBeNull();
    clearState();
    expect(loadState()).toBeNull();
  });
});

describe("view position persistence", () => {
  it("returns null when no view is stored yet", () => {
    expect(loadView()).toBeNull();
  });

  it("round-trips the last-viewed month and step across a refresh", () => {
    saveView({ step: "done", year: 2026, month: 7, applied: true });
    expect(loadView()).toEqual({ step: "done", year: 2026, month: 7, applied: true });
  });

  it("treats a missing applied flag as false", () => {
    window.localStorage.setItem(VIEW_KEY, JSON.stringify({ step: "review", year: 2026, month: 7 }));
    expect(loadView()).toEqual({ step: "review", year: 2026, month: 7, applied: false });
  });

  it("rejects unknown steps and malformed months", () => {
    window.localStorage.setItem(VIEW_KEY, JSON.stringify({ step: "travel", year: 2026, month: 7 }));
    expect(loadView()).toBeNull();
    window.localStorage.setItem(VIEW_KEY, JSON.stringify({ step: "done", year: 2026, month: 12 }));
    expect(loadView()).toBeNull();
    window.localStorage.setItem(VIEW_KEY, JSON.stringify({ step: "done", year: 2026, month: "july" }));
    expect(loadView()).toBeNull();
  });

  it("returns null for corrupt view data", () => {
    window.localStorage.setItem(VIEW_KEY, "{not json");
    expect(loadView()).toBeNull();
  });
});