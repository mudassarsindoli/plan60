"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Stepper, { type FlowStepId } from "@/components/Stepper";
import SetupStep from "@/components/SetupStep";
import PlanStep from "@/components/PlanStep";
import ReviewStep from "@/components/ReviewStep";
import DoneStep from "@/components/DoneStep";
import DayDialog from "@/components/DayDialog";
import { useWfoState } from "@/hooks/useWfoState";
import { loadState, loadView, saveView } from "@/lib/storage";
import { addMonths, dateToKey, toKey } from "@/lib/dates";
import { buildMonthGrid, workingDayKeys } from "@/lib/calendar";
import { getHolidaysForMonths, getMonthHolidayScopes } from "@/lib/holidays";
import {
  countWfoForMonth,
  findWfhPeriods,
  hasMarker,
  hasWfoForMonth,
  longestWfhRun,
  officeTargetForMonth,
  rankKeys,
  remainingForMonth,
} from "@/lib/workFromOffice";
import { planForStrategy, windowKeys } from "@/lib/optimization";
import type { PlanContext, PlanResult } from "@/lib/optimization";
import { strategyById } from "@/lib/strategies";
import { markerLabel } from "@/lib/travel";
import type { StrategyId, TravelKind } from "@/lib/types";

export default function Home() {
  const {
    state,
    toggleWfo,
    setHoliday,
    addTravel,
    removeTravel,
    setStrategy,
    setLeaves,
    setHolidayState,
    applyPlan,
    reset,
  } = useWfoState();

  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateToKey(now), [now]);
  const [step, setStep] = useState<FlowStepId>("setup");
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [editing, setEditing] = useState(false);
  const viewHydrated = useRef(false);

  const months = useMemo(() => {
    const prev = addMonths(viewYear, viewMonth, -1);
    const next = addMonths(viewYear, viewMonth, 1);
    return [prev, { year: viewYear, month: viewMonth }, next];
  }, [viewYear, viewMonth]);

  const holidayMap = useMemo(
    () => getHolidaysForMonths(months, state.manualHolidays, state.state),
    [months, state.manualHolidays, state.state],
  );

  const holidayScopes = useMemo(
    () => getMonthHolidayScopes(viewYear, viewMonth, state.manualHolidays, state.state),
    [viewYear, viewMonth, state.manualHolidays, state.state],
  );

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, holidayMap, holidayScopes),
    [viewYear, viewMonth, holidayMap, holidayScopes],
  );

  const previewMonths = useMemo(() => {
    return months.map(({ year, month }) => ({
      year,
      month,
      cells: buildMonthGrid(
        year,
        month,
        holidayMap,
        getMonthHolidayScopes(year, month, state.manualHolidays, state.state),
      ),
    }));
  }, [months, holidayMap, state.manualHolidays, state.state]);

  const monthKeys = useMemo(
    () => new Set(cells.filter((c) => c.inMonth).map((c) => c.key)),
    [cells],
  );

  const workingSet = useMemo(
    () => new Set(workingDayKeys(viewYear, viewMonth, holidayMap)),
    [viewYear, viewMonth, holidayMap],
  );
  const workingDayCount = workingSet.size;

  const wfoSet = useMemo(() => new Set(state.wfoDates), [state.wfoDates]);

  const monthLeaves =
    state.leavesByMonth[toKey(viewYear, viewMonth, 1).slice(0, 7)] ?? 0;

  const officeTarget = useMemo(
    () => officeTargetForMonth(workingDayCount, monthLeaves),
    [workingDayCount, monthLeaves],
  );

  const count = useMemo(
    () => countWfoForMonth(state.wfoDates, workingSet, officeTarget),
    [state.wfoDates, workingSet, officeTarget],
  );
  const remaining = useMemo(
    () => remainingForMonth(state.wfoDates, workingSet, officeTarget),
    [state.wfoDates, workingSet, officeTarget],
  );

  const windowOrder = useMemo(
    () =>
      windowKeys({
        year: viewYear,
        month: viewMonth,
        holidayMap,
        fixedWfo: state.wfoDates,
        officeCity: state.officeCity,
        homeCity: state.homeCity,
      }),
    [viewYear, viewMonth, holidayMap, state.wfoDates, state.officeCity, state.homeCity],
  );

  const ranked = useMemo(() => rankKeys(windowOrder, wfoSet), [windowOrder, wfoSet]);
  const longest = useMemo(() => longestWfhRun(ranked), [ranked]);
  const wfhPeriods = useMemo(() => findWfhPeriods(ranked), [ranked]);

  const travelDays = useMemo(
    () => Object.keys(state.travel).filter((k) => monthKeys.has(k) && state.travel[k].length).length,
    [state.travel, monthKeys],
  );

  const currentWfoWorking = useMemo(
    () => state.wfoDates.filter((k) => workingSet.has(k)).sort(),
    [state.wfoDates, workingSet],
  );

  const invalidCount = useMemo(
    () => state.wfoDates.filter((k) => monthKeys.has(k) && !workingSet.has(k)).length,
    [state.wfoDates, monthKeys, workingSet],
  );

  const viewMonthSaved = useMemo(
    () => hasWfoForMonth(state.wfoDates, viewYear, viewMonth),
    [state.wfoDates, viewYear, viewMonth],
  );

  const disabledSteps = useMemo<FlowStepId[]>(
    () => (viewMonthSaved && !editing ? ["setup", "plan"] : []),
    [viewMonthSaved, editing],
  );

  const prevYm = useMemo(() => addMonths(viewYear, viewMonth, -1), [viewYear, viewMonth]);
  const prevWorkingSet = useMemo(
    () => new Set(workingDayKeys(prevYm.year, prevYm.month, holidayMap)),
    [prevYm, holidayMap],
  );

  const prevWfoWorking = useMemo(
    () => state.wfoDates.filter((k) => prevWorkingSet.has(k)).sort(),
    [state.wfoDates, prevWorkingSet],
  );

  const planCtx = useMemo<PlanContext>(
    () => ({
      year: viewYear,
      month: viewMonth,
      holidayMap,
      fixedWfo: currentWfoWorking,
      fixedPrev: prevWfoWorking,
      target: officeTarget,
      officeCity: state.officeCity,
      homeCity: state.homeCity,
    }),
    [viewYear, viewMonth, holidayMap, currentWfoWorking, prevWfoWorking, officeTarget, state.officeCity, state.homeCity],
  );

  const strategyPlan = useMemo(
    () => (state.strategy ? planForStrategy(state.strategy, planCtx) : null),
    [state.strategy, planCtx],
  );

  const activePlan =
    state.strategy === null || state.strategy === "custom" ? null : strategyPlan;

  const proposedSet = useMemo(() => {
    if (!activePlan) return null;
    const plan = activePlan;
    return new Set<string>([...plan.wfoCurrent, ...plan.wfoNext]);
  }, [activePlan]);

  const selectedCell = selectedKey ? cells.find((c) => c.key === selectedKey) ?? null : null;
  const selectedMarkerKinds = selectedKey
    ? (state.travel[selectedKey] ?? []).map((m) => m.kind)
    : [];

// Selecting a month decides where you land: a month with saved data opens its
// dashboard (last tab, middle steps locked until you hit Edit); an empty month
// starts a fresh plan from step 1. The one exception is the Review tab — there
// you browse months freely without ever being redirected away.
const selectMonth = (year: number, month: number, opts: { stay?: boolean } = {}) => {
  const targetSaved = hasWfoForMonth(state.wfoDates, year, month);
  setViewYear(year);
  setViewMonth(month);
  if (opts.stay) {
    setEditing(true);
    setApplied(targetSaved);
    setStep("review");
  } else {
    setApplied(false);
    setEditing(false);
    setStep(targetSaved ? "done" : "setup");
  }
};

const navigation = (delta: number, opts?: { stay?: boolean }) => {
  const next = addMonths(viewYear, viewMonth, delta);
  selectMonth(next.year, next.month, opts);
};

const goToday = (opts?: { stay?: boolean }) => {
  const d = new Date();
  selectMonth(d.getFullYear(), d.getMonth(), opts);
};

  const handleToggleWfo = (key: string) => {
    if (!workingSet.has(key)) return;
    toggleWfo(key);
  };

  const handleSetHoliday = (label: string | null) => {
    if (!selectedKey) return;
    setHoliday(selectedKey, label);
  };

  const handleToggleMarker = (kind: TravelKind) => {
    if (!selectedKey) return;
    if (hasMarker(state.travel, selectedKey, kind)) {
      removeTravel(selectedKey, kind);
    } else {
      addTravel(selectedKey, {
        kind,
        label: markerLabel(kind, state.officeCity, state.homeCity),
      });
    }
  };

  const handleApply = () => {
    if (!activePlan) return;
    applyPlan(activePlan, viewYear, viewMonth);
    setApplied(true);
  };

  const handleApplySmart = (plan: PlanResult) => {
    applyPlan(plan, viewYear, viewMonth);
    setApplied(true);
  };

  const handleSelectStrategy = (id: StrategyId) => {
    setStrategy(id);
    if (id !== state.strategy) setApplied(false);
  };

  const handleManual = () => {
    setStrategy("custom");
    setApplied(false);
    setStep("review");
  };

  const handleResetAll = () => {
    reset();
    setApplied(false);
    setEditing(false);
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setStep("setup");
    setSelectedKey(null);
  };

  const handleEditMonth = () => {
    // A month that already has days on the calendar is "applied" — show that
    // state when reopening it for edits.
    if (viewMonthSaved) setApplied(true);
    setEditing(true);
    setStep("review");
  };

  const handleSaveAndView = () => {
    setEditing(false);
    setStep("done");
  };

  const handleStepNav = (id: FlowStepId) => {
    // The Review tab is always open, even for a saved month — opening it there
    // is treated as starting to edit (unlocks the other middle steps).
    if (id === "review" && viewMonthSaved) {
      setEditing(true);
      setApplied(true);
    }
    setStep(id);
  };

const handleMonthChange = (year: number, month: number) => {
  selectMonth(year, month);
};

  const strategyDef = state.strategy ? strategyById(state.strategy) : null;

  // Restore the last-viewed month after hydration so a page refresh lands back
  // on the saved month's dashboard (or step 1 for a month with no data yet).
  useEffect(() => {
    const view = loadView();
    viewHydrated.current = true;
    // Restoring the UI position is intentional — the first render must match
    // the server's defaults (today, setup step).
    /* eslint-disable react-hooks/set-state-in-effect */
    const savedData = loadState();
    if (view) {
      setViewYear(view.year);
      setViewMonth(view.month);
      setEditing(false);
      setStep(
        savedData && hasWfoForMonth(savedData.wfoDates, view.year, view.month)
          ? "done"
          : "setup",
      );
      setApplied(view.applied);
    } else if (savedData && hasWfoForMonth(savedData.wfoDates, viewYear, viewMonth)) {
      // No saved view position, but the current month already has a plan on
      // this device — open its dashboard directly on reload.
      setEditing(false);
      setStep("done");
      setApplied(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // Mount-only restore; the effect must read the initial today's-month values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewHydrated.current) return;
    saveView({ step, year: viewYear, month: viewMonth, applied });
  }, [step, viewYear, viewMonth, applied]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onReset={handleResetAll} />
      <Stepper current={step} onNavigate={handleStepNav} disabledSteps={disabledSteps} />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        {step === "setup" && (
          <SetupStep
            year={viewYear}
            month={viewMonth}
            leaves={monthLeaves}
            workingDays={workingDayCount}
            state={state.state}
            onStateChange={setHolidayState}
            onMonthChange={handleMonthChange}
            onLeavesChange={(n) => {
              setLeaves(viewYear, viewMonth, n);
              setApplied(false);
            }}
            onContinue={() => setStep("plan")}
          />
        )}

        {step === "plan" && (
          <PlanStep
            selected={state.strategy}
            target={officeTarget}
            onSelect={handleSelectStrategy}
            plan={activePlan}
            onContinue={() => setStep("review")}
            onManual={handleManual}
          />
        )}

        {step === "review" && (
          <ReviewStep
            year={viewYear}
            month={viewMonth}
            cells={cells}
            wfoSet={wfoSet}
            proposedSet={activePlan ? proposedSet : null}
            travel={state.travel}
            todayKey={todayKey}
            plan={activePlan}
            applied={applied}
            ctx={planCtx}
            onApplySmart={handleApplySmart}
            onApply={handleApply}
            onBack={() => setStep("plan")}
            onContinue={handleSaveAndView}
            onToggle={handleToggleWfo}
            onOpen={setSelectedKey}
            onPrevMonth={() => navigation(-1, { stay: true })}
            onNextMonth={() => navigation(1, { stay: true })}
            onToday={() => goToday({ stay: true })}
          />
        )}

        {step === "done" && (
          <DoneStep
            year={viewYear}
            month={viewMonth}
            used={count.used}
            remaining={remaining}
            target={count.target}
            longestWfh={longest.length}
            longestFrom={longest.from}
            longestTo={longest.to}
            travelDays={travelDays}
            strategy={strategyDef}
            wfoDates={currentWfoWorking}
            invalidWfo={invalidCount}
            wfhPeriods={wfhPeriods}
            previewMonths={previewMonths}
            wfoSet={wfoSet}
            travel={state.travel}
            todayKey={todayKey}
            onEditCalendar={handleEditMonth}
            onRestart={handleResetAll}
            onPrevMonth={() => navigation(-1)}
            onNextMonth={() => navigation(1)}
            onToday={goToday}
          />
        )}

        <p className="pb-1 pt-2 text-center text-[10px] text-zinc-400 dark:text-zinc-600">
          12 Days Working | Designed &amp; Developed by{" "}
          <a href="https://www.linkedin.com/in/mudassarsindoli/">
            <b className="text-blue-500">mudassar.sindoli</b>
          </a>
        </p>
      </main>

      <DayDialog
        open={selectedKey !== null}
        onClose={() => setSelectedKey(null)}
        keyName={selectedKey}
        cellLabel={selectedKey ? `${selectedCell?.day ?? ""}` : ""}
        isWorkingDay={selectedCell?.isWorkingDay ?? false}
        isWeekend={selectedCell?.kind === "weekend"}
        isWfo={selectedKey ? wfoSet.has(selectedKey) : false}
        holidayName={selectedCell?.holidayName ?? null}
        isManualHoliday={
          selectedKey
            ? Object.prototype.hasOwnProperty.call(state.manualHolidays, selectedKey)
            : false
        }
        markers={selectedMarkerKinds}
        onToggleWfo={() => {
          if (selectedKey) handleToggleWfo(selectedKey);
        }}
        onSetHoliday={handleSetHoliday}
        onToggleMarker={handleToggleMarker}
      />
    </div>
  );
}