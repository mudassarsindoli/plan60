import { useEffect, useMemo, useState } from "react";
import Calendar from "./components/Calendar.jsx";
import Select from "./components/Select.jsx";
import { ACCENT_PRESETS, DEFAULT_ACCENT } from "./lib/accent.js";
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

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      <rect x="7" y="9" width="14" height="18" rx="2.5" fill="#fff" opacity="0.95" />
      <circle cx="22.5" cy="22.5" r="7.5" fill="var(--accent)" />
      <path
        d="M19.3 22.6l2 2 3.4-4.2"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Stat({ value, label, hint }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      {hint && (
        <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          {hint}
        </div>
      )}
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2.5v2.3M12 19.2v2.3M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.4 19.6l1.6-1.6M18 6l1.6-1.6" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M20 14.6A8.5 8.5 0 1 1 9.4 4a7 7 0 0 0 10.6 10.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function initialState() {
  const loaded = loadState();
  if (loaded) return loaded;
  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return { ...defaultState(), darkMode: Boolean(prefersDark) };
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [{ year, month }, setView] = useState(currentYm);
  const [holidayName, setHolidayName] = useState("");
  const [dataMsg, setDataMsg] = useState("");

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.darkMode);
    document.documentElement.style.colorScheme = state.darkMode
      ? "dark"
      : "light";
  }, [state.darkMode]);

  const monthPrefix = toKey(year, month, 1).slice(0, 7);
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

  const target = officeTargetForMonth(workingKeys.length);
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

  function setStateRegion(id) {
    setState((s) => ({ ...s, state: id || null }));
  }

  function setAccentColor(hex) {
    setState((s) => ({ ...s, accentColor: hex }));
  }

  function toggleDarkMode() {
    setState((s) => ({ ...s, darkMode: !s.darkMode }));
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
      [JSON.stringify({ app: "plan60", ...state }, null, 2)],
      {
        type: "application/json",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plan60.json";
    a.click();
    URL.revokeObjectURL(url);
    setDataMsg("Exported plan60.json");
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
        setDataMsg("Could not import: not a valid Plan60 file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const accent = state.accentColor || DEFAULT_ACCENT;

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
    <main
      className="min-h-screen w-full bg-white transition-colors dark:bg-zinc-950"
      style={{ "--accent": accent }}
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10 md:py-10">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-6 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Plan60
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Plan your 60% work-from-office days each month.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            title={state.darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {state.darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-10">
            <section className="space-y-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Settings
              </h2>
              <label className="flex flex-col gap-1.5 text-sm">
                Month
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setView((vm) => addMonths(vm.year, vm.month, -1))
                    }
                    title="Previous month"
                    className="h-9 w-9 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    ‹
                  </button>
                  <input
                    type="month"
                    value={monthValue}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setView((vm) => addMonths(vm.year, vm.month, 1))
                    }
                    title="Next month"
                    className="h-9 w-9 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    ›
                  </button>
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Working state
                <Select
                  value={state.state ?? ""}
                  onChange={setStateRegion}
                  options={HOLIDAY_STATES.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="None (national holidays)"
                />
              </label>
              <div className="flex flex-col gap-1.5 text-sm">
                <span>Accent color</span>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setAccentColor(p.value)}
                      title={p.name}
                      aria-label={p.name}
                      className={
                        "h-7 w-7 rounded-full cursor-pointer" +
                        (accent.toLowerCase() === p.value.toLowerCase()
                          ? " ring-2 ring-offset-2 ring-zinc-900 ring-offset-white dark:ring-zinc-100 dark:ring-offset-zinc-950"
                          : " border border-zinc-200 dark:border-zinc-700")
                      }
                      style={{ backgroundColor: p.value }}
                    />
                  ))}
                  <label
                    className="flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700"
                    title="Custom color"
                  >
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-9 cursor-pointer appearance-none border-none bg-transparent p-0"
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                This month
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <Stat value={target} label="Office days needed" />
                <Stat value={used} label="Planned" />
                <Stat value={remaining} label="Remaining" />
                <Stat
                  value={longest.length}
                  label={`Longest WFH day${longest.length === 1 ? "" : "s"}`}
                  hint={
                    longest.length > 0
                      ? `${shortDate(longest.from)} – ${shortDate(longest.to)}`
                      : undefined
                  }
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Data
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportData}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Export JSON
                </button>
                <label className="cursor-pointer">
                  <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    Import JSON
                  </span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={onImportFile}
                  />
                </label>
              </div>
              {dataMsg && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{dataMsg}</p>
              )}
            </section>
          </aside>

          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                {monthTitle(year, month)}
              </h2>
              <button
                type="button"
                onClick={clearMonth}
                className="text-xs text-zinc-400 hover:text-zinc-900 underline underline-offset-2 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-100"
              >
                Clear month
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                Holiday name
                <input
                  type="text"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Diwali break"
                  className="w-56 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <p className="pb-2 text-xs text-zinc-400 dark:text-zinc-500">
                {holidayName.trim()
                  ? "Click a weekday to mark it as this holiday (click a marked day to remove)."
                  : "Type a name, then click weekdays to mark custom holidays."}
              </p>
            </div>

            <div className="mt-5">
              <Calendar
                cells={cells}
                wfoSet={wfoSet}
                manualHolidays={state.manualHolidays}
                draftName={holidayName.trim()}
                onDayClick={onDayClick}
              />
            </div>

            <div className="mt-8 space-y-3 border-t border-zinc-100 pt-6 text-sm dark:border-zinc-800">
              {customHolidays.length > 0 && (
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    Custom holidays
                  </span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {customHolidays.map(([k, name], i) => (
                      <span key={k}>
                        {i > 0 && " · "}
                        {shortDate(k)} — {name}{" "}
                        <button
                          type="button"
                          onClick={() => removeHoliday(k)}
                          title="Remove holiday"
                          className="text-zinc-400 hover:text-red-600 cursor-pointer dark:text-zinc-500 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  Office days
                </span>{" "}
                {monthWfo.length === 0 ? (
                  <span className="text-zinc-400 dark:text-zinc-500">
                    none yet — click a weekday
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {[...monthWfo]
                      .sort()
                      .map((k) => shortDate(k))
                      .join(", ")}
                  </span>
                )}
              </div>
              {periods.length > 0 && (
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    WFH stretches
                  </span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
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
          </section>
        </div>

        <div className="mt-10 border-t border-zinc-100 pt-6 text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          Created by{" "}
          <a
            className="hover:underline"
            style={{ color: "var(--accent)" }}
            target="_"
            href="https://mudassar-sindoli.vercel.app/"
          >
            mudassar.sindoli
          </a>
        </div>
      </div>
    </main>
  );
}
