import type { AppState } from "./types";

/**
 * A brand-new, empty plan. Nothing is pre-filled: no WFO days, no manual
 * holidays, no travel markers, no preset strategy, office-day count or cities.
 * Only the public-holiday calendar (the holiday master) is built in.
 */
export function defaultState(): AppState {
  return {
    version: 1,
    wfoDates: [],
    manualHolidays: {},
    travel: {},
    strategy: null,
    leavesByMonth: {},
    state: null,
    officeCity: "",
    homeCity: "",
  };
}