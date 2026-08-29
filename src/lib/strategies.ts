import type { StrategyId } from "./types";

export interface StrategyDefinition {
  id: StrategyId;
  name: string;
  tagline: string;
  description: string;
  /** "month" plans only the current month; "pair" also plans the next month. */
  scope: "month" | "pair";
}

export const STRATEGIES: StrategyDefinition[] = [
  {
    id: "month-start",
    name: "Month-Start Strategy",
    tagline: "Front-load the office, then coast at home",
    description:
      "Complete all your office days in the first eligible working days of the month. Once done, the entire back half of the month is uninterrupted WFH.",
    scope: "month",
  },
  {
    id: "month-end",
    name: "Month-End Strategy",
    tagline: "Power through the end of the month",
    description:
      "Complete all your office days in the final eligible working days. Frees the first part of the month for a long, unbroken WFH block that spills over the month start.",
    scope: "month",
  },
  {
    id: "boundary",
    name: "Boundary Strategy",
    tagline: "One trip across the month border",
    description:
      "Merge this month's requirement with the next one: finish your office days at the end of this month and start next month's in the same continuous office stint. One round trip covers both.",
    scope: "pair",
  },
  {
    id: "maximum-wfh",
    name: "Maximum WFH Strategy",
    tagline: "Engineered for the longest WFH streak",
    description:
      "Place this month's WFO days at the start and next month's at the end. Creates the longest continuous WFH period possible across the month boundary.",
    scope: "pair",
  },
  {
    id: "balanced",
    name: "Balanced Strategy",
    tagline: "Predictable, evenly-spaced office days",
    description:
      "Distribute your office days evenly across the month. No long office stretches and no marathon WFH blocks — steady rhythm, easy planning.",
    scope: "month",
  },
  {
    id: "custom",
    name: "Custom Strategy",
    tagline: "Your calendar, your rules",
    description:
      "No automatic placement — keep the WFO days you picked manually and let the app compute the resulting WFH runs and travel impact.",
    scope: "month",
  },
];

export function strategyById(id: StrategyId): StrategyDefinition {
  return STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[5];
}

export function strategyDisplayName(id: StrategyId): string {
  return strategyById(id).name;
}