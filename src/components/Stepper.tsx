import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import type { FlowStepId } from "@/lib/types";

export type { FlowStepId };

export const FLOW_STEPS: { id: FlowStepId; label: string }[] = [
  { id: "setup", label: "Month & office days" },
  { id: "plan", label: "Choose how to plan" },
  { id: "review", label: "Review your month" },
  { id: "done", label: "Month dashboard" },
];

interface StepperProps {
  current: FlowStepId;
  onNavigate: (id: FlowStepId) => void;
  /** Steps the user cannot jump straight into (e.g. a month already saved). */
  disabledSteps?: FlowStepId[];
}

export default function Stepper({ current, onNavigate, disabledSteps = [] }: StepperProps) {
  const currentIndex = FLOW_STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Progress" className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <ol className="flex items-start gap-1 sm:gap-2">
        {FLOW_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = step.id === current;
          const isDisabled = disabledSteps.includes(step.id);
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 sm:mb-4 ${
                    isDone || isActive ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                disabled={isDisabled}
                aria-current={isActive ? "step" : undefined}
                aria-disabled={isDisabled}
                className={`group flex min-w-0 items-center gap-2 pb-2 ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <StepBadge
                  state={isActive ? "active" : isDone ? "done" : "idle"}
                  number={index + 1}
                  icon={Check}
                />
                <span
                  className={`hidden truncate text-xs font-medium sm:block ${
                    isActive ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepBadge({
  state,
  number,
  icon: Icon,
}: {
  state: "idle" | "active" | "done";
  number: number;
  icon: LucideIcon;
}) {
  if (state === "done") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 dark:bg-indigo-500">
        <Icon size={13} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600 bg-indigo-600 text-xs font-bold text-white dark:border-indigo-400 dark:bg-indigo-500">
        {number}
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-xs font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500">
      {number}
    </span>
  );
}