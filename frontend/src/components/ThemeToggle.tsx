"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="group inline-flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/75 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-blue-950/[0.03] transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700/70 dark:bg-[#111A38]/70 dark:text-slate-200 dark:shadow-none dark:hover:border-cyan-400/50 dark:hover:bg-[#151F43] dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950"
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-fuchsia-500 text-xs text-white shadow-sm shadow-fuchsia-950/20"
        >
          {isDark ? (
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
              <path
                d="M14.5 13.7A6.5 6.5 0 0 1 6.3 5.5 6.5 6.5 0 1 0 14.5 13.7Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
              <circle cx="10" cy="10" r="4" fill="currentColor" />
              <path
                d="M10 1.8v2M10 16.2v2M18.2 10h-2M3.8 10h-2M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4M15.8 15.8l-1.4-1.4M5.6 5.6 4.2 4.2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.7"
              />
            </svg>
          )}
        </span>
        {!compact ? <span>{isDark ? "Dark mode" : "Light mode"}</span> : null}
      </span>
      {!compact ? (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isDark ? "Moon" : "Sun"}
        </span>
      ) : null}
    </button>
  );
}
