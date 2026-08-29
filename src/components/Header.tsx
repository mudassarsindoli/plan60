"use client";

import { Building2, RotateCcw } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  /** Clears every saved month's plan (with a confirmation in the click handler). */
  onReset?: () => void;
}

export default function Header({ onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <Building2 size={18} />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              12 Days Working
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Plan your work-from-office days · maximize WFH
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset for all months? This permanently clears every saved plan on this device.",
                  )
                ) {
                  onReset();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              title="Clears every saved month's plan on this device"
            >
              <RotateCcw size={13} />
              Reset for all months
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}