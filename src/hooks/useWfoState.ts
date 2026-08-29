"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState, StrategyId, TravelMarker } from "@/lib/types";
import type { StateId } from "@/lib/holidays";
import { loadState, saveState } from "@/lib/storage";
import { defaultState } from "@/lib/defaultState";
import {
  addTravelMarker,
  removeTravelMarker,
} from "@/lib/workFromOffice";
import { toKey } from "@/lib/dates";
import { workingDayKeys } from "@/lib/calendar";
import { getHolidaysForMonths } from "@/lib/holidays";
import type { PlanResult } from "@/lib/optimization";

export function useWfoState() {
  // Always start from the empty default so the server and the client's first
  // render agree (avoids hydration mismatches) — saved data is loaded after.
  const [state, setState] = useState<AppState>(() => defaultState());
  // Captured in the hydration effect so the persist effect can tell the
  // pristine default apart from real (or restored) state.
  const initialDefault = useRef<AppState | null>(null);

  useEffect(() => {
    initialDefault.current = state;
    const loaded = loadState();
    // Hydrating persisted state once after mount is the intended pattern here;
    // the initial render must match the server's empty default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setState(loaded);
    // Mount-only snapshot of the pristine default; re-running is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // The first persist run must NOT write the pristine default over saved
    // data — it fires before the hydration state re-renders, so it would
    // clobber localStorage and a page reload would see an "empty" month.
    if (state === initialDefault.current) return;
    saveState(state);
  }, [state]);

  const toggleWfo = useCallback((key: string) => {
    setState((s) => ({
      ...s,
      wfoDates: s.wfoDates.includes(key)
        ? s.wfoDates.filter((k) => k !== key)
        : [...s.wfoDates, key],
    }));
  }, []);

  const setHoliday = useCallback((key: string, label: string | null) => {
    setState((s) => {
      const next = { ...s.manualHolidays };
      if (label && label.trim()) next[key] = label.trim();
      else delete next[key];
      return { ...s, manualHolidays: next };
    });
  }, []);

  const addTravel = useCallback((key: string, marker: TravelMarker) => {
    setState((s) => ({ ...s, travel: addTravelMarker(s.travel, key, marker) }));
  }, []);

  const removeTravel = useCallback((key: string, kind: string) => {
    setState((s) => ({ ...s, travel: removeTravelMarker(s.travel, key, kind) }));
  }, []);

  const setStrategy = useCallback((strategy: StrategyId) => {
    setState((s) => ({ ...s, strategy }));
  }, []);

  const setLeaves = useCallback(
    (year: number, month: number, leaves: number) => {
      const prefix = toKey(year, month, 1).slice(0, 7);
      const clamped = Math.min(31, Math.max(0, Math.round(leaves)));
      setState((s) => {
        const next = { ...s.leavesByMonth };
        if (clamped <= 0) delete next[prefix];
        else next[prefix] = clamped;
        return { ...s, leavesByMonth: next };
      });
    },
    [],
  );

  const setCities = useCallback((officeCity: string, homeCity: string) => {
    setState((s) => ({ ...s, officeCity, homeCity }));
  }, []);

  /**
   * Apply a computed plan: replace (or, for custom plans, merge into) the WFO
   * days of the CURRENT month only. Months before/after it keep their own saved
   * days untouched — each month is planned and saved independently. Travel
   * markers are never auto-added — the calendar stays clean, only office days
   * are planned.
   */
  const applyPlan = useCallback(
    (plan: PlanResult, year: number, month: number) => {
      const ym = { year, month };
      const holidayMap = getHolidaysForMonths([ym], state.manualHolidays, state.state);
      const curSet = new Set(workingDayKeys(ym.year, ym.month, holidayMap));

      setState((s) => {
        // Only the current month's portion of the plan is applied — neighbor
        // months keep their own saved days untouched.
        const outside = s.wfoDates.filter((k) => !curSet.has(k));
        const planned = [...plan.wfoPrev, ...plan.wfoCurrent, ...plan.wfoNext];
        const myPlanned = planned.filter((k) => curSet.has(k));
        let wfoDates: string[];
        if (plan.strategy === "custom") {
          // Custom/smart plans keep the user's current-month days and add the gap.
          const inWindow = s.wfoDates.filter((k) => curSet.has(k));
          wfoDates = [...new Set([...outside, ...myPlanned, ...inWindow])];
        } else {
          // Strategy templates replace the current month wholesale.
          wfoDates = [...new Set([...outside, ...myPlanned])];
        }
        return { ...s, wfoDates, strategy: plan.strategy };
      });
    },
    [state.manualHolidays, state.state],
  );

  const clearMonth = useCallback((year: number, month: number) => {
    const prefix = toKey(year, month, 1).slice(0, 7);
    setState((s) => ({
      ...s,
      wfoDates: s.wfoDates.filter((k) => !k.startsWith(prefix)),
      travel: Object.fromEntries(
        Object.entries(s.travel).filter(([k]) => !k.startsWith(prefix)),
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    // "Reset for all months" wipes the plan, but the picked holiday state is an
    // app-level preference — keep it across resets.
    setState((s) => ({ ...defaultState(), state: s.state }));
  }, []);

  const setHolidayState = useCallback((id: StateId | null) => {
    setState((s) => ({ ...s, state: id }));
  }, []);

  return {
    state,
    toggleWfo,
    setHoliday,
    addTravel,
    removeTravel,
    setStrategy,
    setLeaves,
    setCities,
    setHolidayState,
    applyPlan,
    clearMonth,
    reset,
  };
}

export type WfoStateApi = ReturnType<typeof useWfoState>;