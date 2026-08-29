import { CURRENT_STATE_VERSION, STORAGE_KEY, VIEW_KEY } from "./types";
import { isKnownState } from "./holidays";
import type {
  AppState,
  FlowStepId,
  StrategyId,
  TravelKind,
  TravelMarker,
} from "./types";
import { defaultState } from "./defaultState";
import { STRATEGIES } from "./strategies";

const TRAVEL_KINDS: TravelKind[] = [
  "book-train",
  "book-bus",
  "travel-office",
  "travel-home",
];

const STRATEGY_IDS = new Set(STRATEGIES.map((s) => s.id));

/**
 * localStorage persistence. All writes go through a single versioned key; reads
 * validate the shape and fall back to a clean default state when missing or
 * corrupt. Guarded so this module is safe in non-browser environments (SSR).
 */
function canUseStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__wfo_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function loadState(): AppState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — state stays in memory
  }
}

export function clearState(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

const VIEW_STEPS: FlowStepId[] = ["setup", "plan", "review", "done"];

export interface ViewState {
  step: FlowStepId;
  year: number;
  month: number;
  applied: boolean;
}

/**
 * The last-viewed UI position (step + month + applied flag) is kept separately
 * from the plan data so a full page refresh returns straight to the saved
 * month's dashboard instead of resetting to today, step 1.
 */
export function loadView(): ViewState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(VIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isNonNullObject(parsed)) return null;
    const step = parsed.step;
    const year = parsed.year;
    const month = parsed.month;
    if (typeof step !== "string" || !VIEW_STEPS.includes(step as FlowStepId)) return null;
    if (typeof year !== "number" || !Number.isInteger(year) || year < 2000 || year > 2100) {
      return null;
    }
    if (typeof month !== "number" || !Number.isInteger(month) || month < 0 || month > 11) {
      return null;
    }
    return { step: step as FlowStepId, year, month, applied: parsed.applied === true };
  } catch {
    return null;
  }
}

export function saveView(view: ViewState): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    // storage full or unavailable — UI position stays in memory
  }
}

function isNonNullObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Coerce a parsed value into a valid `AppState`, tolerating partial/corrupt data. */
export function normalize(parsed: unknown): AppState | null {
  if (!isNonNullObject(parsed)) return null;
  const base = defaultState();
  if (Array.isArray(parsed.wfoDates)) {
    base.wfoDates = parsed.wfoDates.filter((v): v is string => typeof v === "string");
  }
  if (isNonNullObject(parsed.manualHolidays)) {
    base.manualHolidays = collectStringMap(parsed.manualHolidays);
  }
  if (isNonNullObject(parsed.leavesByMonth)) {
    base.leavesByMonth = collectNumberMap(parsed.leavesByMonth);
  }
  if (isNonNullObject(parsed.travel)) {
    base.travel = collectTravelMap(parsed.travel);
  }
  if (typeof parsed.strategy === "string" && STRATEGY_IDS.has(parsed.strategy as StrategyId)) {
    base.strategy = parsed.strategy as StrategyId;
  }
  if (typeof parsed.officeCity === "string") base.officeCity = parsed.officeCity;
  if (typeof parsed.homeCity === "string") base.homeCity = parsed.homeCity;
  if (typeof parsed.state === "string" && isKnownState(parsed.state)) {
    base.state = parsed.state;
  }
  base.version = CURRENT_STATE_VERSION;
  return base;
}

function collectStringMap(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function collectNumberMap(obj: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = Math.min(31, Math.max(0, Math.round(value)));
    }
  }
  return out;
}

function sanitizeMarker(v: unknown): TravelMarker | null {
  if (!isNonNullObject(v)) return null;
  const kind = v.kind;
  const label = v.label;
  if (typeof kind !== "string" || typeof label !== "string") return null;
  if (!TRAVEL_KINDS.includes(kind as TravelKind)) return null;
  return { kind: kind as TravelKind, label };
}

function collectTravelMap(
  obj: Record<string, unknown>,
): Record<string, TravelMarker[]> {
  const out: Record<string, TravelMarker[]> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!Array.isArray(value)) continue;
    const markers = value
      .map(sanitizeMarker)
      .filter((m): m is TravelMarker => m !== null);
    if (markers.length > 0) out[key] = markers;
  }
  return out;
}