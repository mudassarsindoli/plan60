import { useEffect, useMemo, useState } from "react";
import Calendar from "./components/Calendar.jsx";
import { buildMonthGrid } from "./lib/calendar.js";
import { addMonths, monthTitle, shortDate, toKey } from "./lib/dates.js";
import { getMonthHolidays, HOLIDAY_STATES } from "./lib/holidays.js";
import {
  defaultState,
  loadState,
  normalize,
  saveState,
} from "./lib/storage.js";
import {
  countWfoForMonth,
  findWfhPeriods,
  longestWfhRun,
  officeTargetForMonth,
  rankKeys,
} from "./lib/wfo.js";

function currentYm() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default function App() {
  const [state, setState] = useState(() => loadState() ?? defaultState());
  const [{ year, month }, setView] = useState(currentYm);
  const [holidayName, setHolidayName] = useState("");
  const [dataMsg, setDataMsg] = useState("");

  useEffect(() => {
    saveState(state);
  }, [state]);

  const monthPrefix = toKey(year, month, 1).slice(0, 7);
  const leaves = state.leavesByMonth[monthPrefix] ?? 0;
  const manualSet = useMemo(
    () =>
      new Set(
        Object.keys(state.manualHolidays).filter((k) =>
          k.startsWith(monthPrefix),
        ),
      ),
    [state.manualHolidays, monthPrefix],
  );

  const holidayMap = useMemo(
    () => getMonthHolidays(year, month, state.state),
    [year, month, state.state],
  );
  const cells = useMemo(
    () => buildMonthGrid(year, month, holidayMap),
    [year, month, holidayMap],
  );

  const workingKeys = useMemo(
    () =>
      cells
        .filter((c) => c.inMonth && c.isWorkingDay && !manualSet.has(c.key))
        .map((c) => c.key),
    [cells, manualSet],
  );
  const workingSet = useMemo(() => new Set(workingKeys), [workingKeys]);

  const monthWfo = useMemo(
    () => state.wfoDates.filter((k) => k.startsWith(monthPrefix)),
    [state.wfoDates, monthPrefix],
  );
  const wfoSet = useMemo(() => new Set(monthWfo), [monthWfo]);

  const target = officeTargetForMonth(workingKeys.length, leaves);
  const { used } = countWfoForMonth(monthWfo, workingSet, target);
  const remaining = Math.max(0, target - used);

  const ranked = useMemo(
    () =>
      rankKeys(
        cells.filter((c) => c.inMonth).map((c) => c.key),
        wfoSet,
      ).map((d) => {
        const cell = cells.find((c) => c.key === d.key);
        const atOffice =
          cell.isWorkingDay && !manualSet.has(d.key) && wfoSet.has(d.key);
        return { key: d.key, isHome: !atOffice };
      }),
    [cells, wfoSet, manualSet],
  );

  const longest = longestWfhRun(ranked);
  const periods = findWfhPeriods(ranked).slice(0, 3);

  const customHolidays = useMemo(
    () =>
      Object.entries(state.manualHolidays)
        .filter(([k]) => k.startsWith(monthPrefix))
        .sort(([a], [b]) => (a < b ? -1 : 1)),
    [state.manualHolidays, monthPrefix],
  );

  function onDayClick(key, isCustom) {
    setState((s) => {
      if (isCustom) {
        const next = { ...s.manualHolidays };
        delete next[key];
        return { ...s, manualHolidays: next };
      }
      const name = holidayName.trim();
      if (name) {
        return {
          ...s,
          manualHolidays: { ...s.manualHolidays, [key]: name },
          wfoDates: s.wfoDates.filter((k) => k !== key),
        };
      }
      return {
        ...s,
        wfoDates: s.wfoDates.includes(key)
          ? s.wfoDates.filter((k) => k !== key)
          : [...s.wfoDates, key],
      };
    });
  }

  function removeHoliday(key) {
    setState((s) => {
      const next = { ...s.manualHolidays };
      delete next[key];
      return { ...s, manualHolidays: next };
    });
  }

  function setLeaves(value) {
    const n = Math.min(31, Math.max(0, Math.round(Number(value) || 0)));
    setState((s) => {
      const next = { ...s.leavesByMonth };
      if (n <= 0) delete next[monthPrefix];
      else next[monthPrefix] = n;
      return { ...s, leavesByMonth: next };
    });
  }

  function setStateRegion(id) {
    setState((s) => ({ ...s, state: id || null }));
  }

  function clearMonth() {
    setState((s) => ({
      ...s,
      wfoDates: s.wfoDates.filter((k) => !k.startsWith(monthPrefix)),
      manualHolidays: Object.fromEntries(
        Object.entries(s.manualHolidays).filter(
          ([k]) => !k.startsWith(monthPrefix),
        ),
      ),
    }));
  }

  function exportData() {
    const blob = new Blob(
      [JSON.stringify({ app: "wodaca", ...state }, null, 2)],
      {
        type: "application/json",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wodaca.json";
    a.click();
    URL.revokeObjectURL(url);
    setDataMsg("Exported wodaca.json");
  }

  function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let imported;
      try {
        imported = normalize(JSON.parse(reader.result));
      } catch {
        imported = null;
      }
      if (imported) {
        setState(imported);
        setDataMsg("Imported — saved on this device");
      } else {
        setDataMsg("Could not import: not a valid wodaca file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const monthValue = `${year}-${String(month + 1).padStart(2, "0")}`;

  function onMonthChange(value) {
    const m = /^(\d{4})-(\d{2})$/.exec(value);
    if (!m) return;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    if (mo < 0 || mo > 11) return;
    setView({ year: y, month: mo });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-gray-300">
        <span className="text-black">wo</span>RKING
        <span className="text-black">da</span>YS
        <span className="text-black">ca</span>LENDAR
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Plan your 60% work-from-office days each month.
      </p>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Month
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setView((vm) => addMonths(vm.year, vm.month, -1))}
              title="Previous month"
              className="h-8 w-8 rounded border border-zinc-300 hover:bg-zinc-100 cursor-pointer"
            >
              ‹
            </button>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => onMonthChange(e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1.5"
            />
            <button
              type="button"
              onClick={() => setView((vm) => addMonths(vm.year, vm.month, 1))}
              title="Next month"
              className="h-8 w-8 rounded border border-zinc-300 hover:bg-zinc-100 cursor-pointer"
            >
              ›
            </button>
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Planned leaves
          <input
            type="number"
            min="0"
            max="31"
            value={leaves}
            onChange={(e) => setLeaves(e.target.value)}
            className="w-20 rounded border border-zinc-300 px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Working state
          <select
            value={state.state ?? ""}
            onChange={(e) => setStateRegion(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1.5"
          >
            <option value="">None (national holidays)</option>
            {HOLIDAY_STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          Office days needed: <strong>{target}</strong>
        </span>
        <span>
          Planned: <strong>{used}</strong>
        </span>
        <span>
          Remaining: <strong>{remaining}</strong>
        </span>
        <span>
          Longest WFH:{" "}
          <strong>
            {longest.length} day{longest.length === 1 ? "" : "s"}
          </strong>
          {longest.length > 0 && (
            <span className="text-zinc-500">
              {" "}
              ({shortDate(longest.from)} – {shortDate(longest.to)})
            </span>
          )}
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium">{monthTitle(year, month)}</h2>
        <button
          type="button"
          onClick={clearMonth}
          className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 cursor-pointer"
        >
          Clear month
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Holiday name
          <input
            type="text"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            placeholder="e.g. Diwali break"
            className="w-48 rounded border border-zinc-300 px-2 py-1.5"
          />
        </label>
        <p className="pb-1.5 text-xs text-zinc-500">
          {holidayName.trim()
            ? "Click a weekday to mark it as this holiday (click a marked day to remove)."
            : "Type a name, then click weekdays to mark custom holidays."}
        </p>
      </div>
      <div className="mt-2">
        <Calendar
          cells={cells}
          wfoSet={wfoSet}
          manualHolidays={state.manualHolidays}
          draftName={holidayName.trim()}
          onDayClick={onDayClick}
        />
      </div>
      <div className="mt-6 space-y-2 text-sm">
        {customHolidays.length > 0 && (
          <div>
            <span className="font-medium">Custom holidays:</span>{" "}
            <span>
              {customHolidays.map(([k, name], i) => (
                <span key={k}>
                  {i > 0 && " · "}
                  {shortDate(k)} — {name}{" "}
                  <button
                    type="button"
                    onClick={() => removeHoliday(k)}
                    title="Remove holiday"
                    className="text-zinc-400 hover:text-red-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </span>
          </div>
        )}
        <div>
          <span className="font-medium">Office days:</span>{" "}
          {monthWfo.length === 0 ? (
            <span className="text-zinc-500">none yet — click a weekday</span>
          ) : (
            <span>
              {[...monthWfo]
                .sort()
                .map((k) => shortDate(k))
                .join(", ")}
            </span>
          )}
        </div>
        {periods.length > 0 && (
          <div>
            <span className="font-medium">WFH stretches:</span>{" "}
            <span className="text-zinc-600">
              {periods
                .map(
                  (p) =>
                    `${shortDate(p.from)} – ${shortDate(p.to)} (${p.length}d)`,
                )
                .join(" · ")}
            </span>
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 text-sm">
        <span className="text-zinc-500">Data</span>
        <button
          type="button"
          onClick={exportData}
          className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 cursor-pointer"
        >
          Export JSON
        </button>
        <label className="cursor-pointer">
          <span className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">
            Import JSON
          </span>
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
          />
        </label>
        {dataMsg && <span className="text-xs text-zinc-500">{dataMsg}</span>}
      </div>
      <div className="font-medium text-xs mt-6">
        Created by{" "}
        <a
          className="text-blue-600 hover:underline"
          target="_"
          href="https://mudassar-sindoli.vercel.app/"
        >
          mudassar.sindoli
        </a>
      </div>
    </main>
  );
}
