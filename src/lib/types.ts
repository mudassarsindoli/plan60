import type { StateId } from "@/lib/holidays";

export type TravelKind = "book-train" | "book-bus" | "travel-office" | "travel-home";

export interface TravelMarker {
  kind: TravelKind;
  label: string;
}

export type StrategyId =
  | "month-end"
  | "month-start"
  | "boundary"
  | "maximum-wfh"
  | "balanced"
  | "custom";

export type FlowStepId = "setup" | "plan" | "review" | "done";

export interface AppState {
  version: number;
  /** Date keys ("YYYY-MM-DD") selected as WFO. */
  wfoDates: string[];
  /** User-marked holidays: date key -> label. */
  manualHolidays: Record<string, string>;
  /** Travel markers by date key. */
  travel: Record<string, TravelMarker[]>;
  /** null until the user picks a strategy. */
  strategy: StrategyId | null;
  /** Leaves planned per month ("YYYY-MM" -> count). Unspecified months have none. */
  leavesByMonth: Record<string, number>;
  /** Working state id — activates that state's holidays alongside national ones. */
  state: StateId | null;
  officeCity: string;
  homeCity: string;
}

export type Theme = "light" | "dark";

export const STORAGE_KEY = "wfo-strategist:v2";
export const VIEW_KEY = "wfo-strategist:view";
export const THEME_KEY = "wfo-strategist:theme";
export const CURRENT_STATE_VERSION = 1;