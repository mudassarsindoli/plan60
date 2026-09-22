import { WEEKDAY_LABELS } from "../lib/calendar.js";

export default function Calendar({
  cells,
  wfoSet,
  manualHolidays,
  draftName,
  onDayClick,
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="py-1 text-center text-xs font-medium text-zinc-500"
        >
          {label}
        </div>
      ))}
      {cells.map((cell) => {
        if (!cell.inMonth) {
          return <div key={cell.key} className="h-10" />;
        }
        const custom = manualHolidays[cell.key];
        const selected = wfoSet.has(cell.key);

        let cls = "h-10 rounded text-sm flex items-center justify-center";
        let clickable = false;
        let title;

        if (custom) {
          cls += " bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer";
          clickable = true;
          title = custom;
        } else if (selected) {
          cls += " bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer";
          clickable = true;
        } else if (cell.kind === "holiday") {
          cls += " bg-amber-50 text-amber-800";
          title = cell.holidayName;
        } else if (cell.kind === "weekend") {
          cls += " bg-zinc-50 text-zinc-400";
        } else {
          cls += " border-zinc-200 hover:bg-zinc-100 cursor-pointer";
          clickable = true;
          title = draftName ? `Set holiday: ${draftName}` : undefined;
        }

        if (clickable) {
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onDayClick(cell.key, Boolean(custom))}
              title={title}
              className={cls}
            >
              {cell.day}
            </button>
          );
        }
        return (
          <div key={cell.key} className={cls} title={title}>
            {cell.day}
          </div>
        );
      })}
    </div>
  );
}