"use client";

import { MoreVertical } from "lucide-react";
import type { DayCell as DayCellType } from "@/lib/calendar";
import { TRAVEL_KIND_META } from "@/lib/travel";
import type { TravelMarker } from "@/lib/types";

interface DayCellProps {
  cell: DayCellType;
  isWfo: boolean;
  isToday: boolean;
  isProposed?: boolean;
  markers: TravelMarker[];
  /** Read-only cells show every marking but block all interaction (previews). */
  readOnly?: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

const MARKER_BADGE: Record<string, string> = {
  "book-train": "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/15",
  "book-bus": "text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-500/15",
  "travel-office": "text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/15",
  "travel-home": "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/15",
};

export default function DayCell({
  cell,
  isWfo,
  isToday,
  isProposed = false,
  markers,
  readOnly = false,
  onToggle,
  onOpen,
}: DayCellProps) {
  const openDialog = () => onOpen();

  return (
    <div
      className={[
        "group relative flex min-h-14 flex-col rounded-lg border p-1 sm:min-h-[64px] sm:p-1.5",
        baseClasses(cell, isWfo, isProposed),
        cell.inMonth ? "" : "opacity-45",
      ].join(" ")}
    >
      {!readOnly && (
        <button
          type="button"
          onClick={() => (cell.isWorkingDay && cell.inMonth ? onToggle() : openDialog())}
          className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`${cell.day} · ${
            cell.holidayName ?? (cell.kind === "weekend" ? "weekend" : isWfo ? "WFO" : isProposed ? "proposed WFO" : "WFH")
          }${!cell.inMonth ? " (outside month)" : ""}`}
        />
      )}

      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-1">
        <span
          className={[
            "text-xs font-medium tabular-nums sm:text-[13px]",
            isWfo
              ? "text-white"
              : isProposed
                ? "text-indigo-700 dark:text-indigo-300"
                : cell.kind === "holiday"
                  ? "text-amber-700 dark:text-amber-300"
                  : cell.isWorkingDay
                    ? "text-zinc-700 dark:text-zinc-200"
                    : "text-red-500 dark:text-zinc-600",
          ].join(" ")}
        >
          {cell.day}
          {isToday && (
            <span
              className={[
                "ml-1 inline-block h-1.5 w-1.5 rounded-full",
                isWfo ? "bg-white/90" : "bg-indigo-500",
              ].join(" ")}
            />
          )}
        </span>

        {!readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDialog();
            }}
            className={[
              "pointer-events-auto rounded p-0.5 transition-opacity",
              isWfo
                ? "text-white/80 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                : "text-zinc-400 hover:text-zinc-700 sm:opacity-0 sm:group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-zinc-200",
            ].join(" ")}
            aria-label={`Actions for day ${cell.day}`}
          >
            <MoreVertical size={12} />
          </button>
        )}
      </div>

      <div className="pointer-events-none relative z-10 mt-auto flex flex-col gap-0.5">
        {cell.kind === "holiday" && cell.holidayName && (
          <span
            title={
              cell.holidayScope === "state"
                ? `${cell.holidayName} (state holiday — only if your office is in the selected state)`
                : undefined
            }
            className={[
              "hidden truncate text-[9px] font-medium uppercase tracking-wide sm:block",
              isWfo
                ? "text-white/90"
                : "text-amber-600 dark:text-amber-400",
            ].join(" ")}
          >
            🗓 {cell.holidayName}
            {cell.holidayScope === "state" && (
              <span className="ml-0.5 font-bold text-amber-500 dark:text-amber-300">•</span>
            )}
          </span>
        )}
        {isWfo && (
          <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-white/90">
            WFO
          </span>
        )}
        {!isWfo && isProposed && (
          <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
            Plan
          </span>
        )}
        {markers.length > 0 && (
          <span className="flex flex-wrap gap-0.5">
            {markers.slice(0, 2).map((m) => (
              <span
                key={m.kind}
                className={[
                  "truncate rounded px-1 py-px text-[9px] font-medium",
                  MARKER_BADGE[m.kind] ?? "text-zinc-600 bg-zinc-100",
                ].join(" ")}
              >
                {(TRAVEL_KIND_META[m.kind]?.shortLabel ?? m.kind)
                  .replace(/^Book /, "🎫 ")
                  .replace(/^book /, "🎫 ")}
              </span>
            ))}
            {markers.length > 2 && (
              <span className="rounded px-1 py-px text-[9px] font-medium text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800">
                +{markers.length - 2}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function baseClasses(cell: DayCellType, isWfo: boolean, isProposed: boolean): string {
  if (isWfo) {
    return "bg-indigo-600 shadow-sm shadow-indigo-600/30 dark:bg-indigo-500";
  }
  if (isProposed) {
    return "border-2 border-dashed border-indigo-400 bg-indigo-50/70 dark:border-indigo-500/70 dark:bg-indigo-500/10";
  }
  if (cell.kind === "holiday") {
    return "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10";
  }
  if (cell.isWorkingDay) {
    return "border-zinc-200 bg-white hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-600";
  }
  return "border-zinc-200/60 bg-zinc-100/60 dark:border-zinc-800/60 dark:bg-zinc-900/40";
}