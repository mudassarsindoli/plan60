import { isKnownState } from "./holidays.js";

const STORAGE_KEY = "wodaca:v1";

/** A brand-new, empty plan. Only the built-in holiday calendar is active. */
export function defaultState() {
  return {
    wfoDates: [],
    manualHolidays: {},
    leavesByMonth: {},
    state: null,
  };
}

function canUseStorage() {
  try {
    const probe = "__wodaca_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function isNonNullObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Coerce a parsed value into a valid state, tolerating partial/corrupt data. */
export function normalize(parsed) {
  if (!isNonNullObject(parsed)) return null;
  const base = defaultState();
  if (Array.isArray(parsed.wfoDates)) {
    base.wfoDates = parsed.wfoDates.filter((v) => typeof v === "string");
  }
  if (isNonNullObject(parsed.manualHolidays)) {
    for (const [key, value] of Object.entries(parsed.manualHolidays)) {
      if (typeof value === "string" && value.trim()) base.manualHolidays[key] = value.trim();
    }
  }
  if (isNonNullObject(parsed.leavesByMonth)) {
    for (const [key, value] of Object.entries(parsed.leavesByMonth)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        base.leavesByMonth[key] = Math.min(31, Math.max(0, Math.round(value)));
      }
    }
  }
  if (typeof parsed.state === "string" && isKnownState(parsed.state)) {
    base.state = parsed.state;
  }
  return base;
}

export function loadState() {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveState(state) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — state stays in memory
  }
}
