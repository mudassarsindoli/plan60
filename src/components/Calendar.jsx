import { WEEKDAY_LABELS } from "../lib/calendar.js";

export default function Calendar({
  cells,
  wfoSet,
  manualHolidays,
  draftName,
  onDayClick,
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="py-1 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500"
        >
          {label}
        </div>
      ))}
      {cells.map((cell) => {
        if (!cell.inMonth) {
          return <div key={cell.key} className="h-12" />;
        }
        const custom = manualHolidays[cell.key];
        const selected = wfoSet.has(cell.key);

        let cls =
          "relative h-12 rounded-lg text-sm font-medium flex items-center justify-center";
        let clickable = false;
        let title;
        let style;
        let badge;

        if (custom) {
          cls += " bg-red-600 text-white hover:bg-red-500 cursor-pointer";
          clickable = true;
          title = custom;
          badge = (
            <span className="absolute right-1 top-1 text-[10px] leading-none">
              ★
            </span>
          );
        } else if (selected) {
          cls += " text-white hover:opacity-90 transition-opacity cursor-pointer";
          style = { backgroundColor: "var(--accent)" };
          clickable = true;
        } else if (cell.kind === "holiday") {
          cls += " bg-red-600 text-white";
          title = cell.holidayName;
          if (cell.holidayCode) {
            badge = (
              <span className="absolute right-1 top-1 text-[9px] font-semibold leading-none opacity-90">
                {cell.holidayCode}
              </span>
            );
          }
        } else if (cell.kind === "weekend") {
          cls += " bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600";
        } else {
          cls +=
            " border border-zinc-100 hover:bg-zinc-50 cursor-pointer dark:border-zinc-800 dark:hover:bg-zinc-800";
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
              style={style}
            >
              {cell.day}
              {badge}
            </button>
          );
        }
        return (
          <div key={cell.key} className={cls} title={title} style={style}>
            {cell.day}
            {badge}
          </div>
        );
      })}
    </div>
  );
}