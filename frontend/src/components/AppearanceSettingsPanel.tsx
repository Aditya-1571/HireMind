"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Card } from "@/components/ui";

const options = [
  {
    value: "light",
    title: "Light mode",
    description: "Soft blue and lavender surfaces for bright environments.",
  },
  {
    value: "dark",
    title: "Dark mode",
    description: "Deep navy workspace with premium contrast and accents.",
  },
] as const;

export function AppearanceSettingsPanel() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <Card className="p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
          Appearance
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Choose how HireMind looks on this device. Your preference is saved in
          this browser and applies immediately.
        </p>
      </div>

      <div
        className="mt-6 grid gap-4 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Theme preference"
      >
        {options.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "ArrowLeft" ||
                  event.key === "ArrowRight" ||
                  event.key === "ArrowUp" ||
                  event.key === "ArrowDown"
                ) {
                  event.preventDefault();
                  toggleTheme();
                }
              }}
              className={
                selected
                  ? "rounded-2xl border border-blue-400/50 bg-gradient-to-br from-blue-600/12 to-fuchsia-500/12 p-4 text-left shadow-sm shadow-blue-950/10 ring-2 ring-blue-500/30 dark:border-cyan-300/40 dark:ring-cyan-300/20"
                  : "rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/70 dark:bg-slate-950/25 dark:hover:border-cyan-400/40 dark:hover:bg-slate-800/70 dark:focus-visible:ring-cyan-300"
              }
            >
              <span className="block overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span
                  className={
                    option.value === "dark"
                      ? "block h-24 bg-[#050816] p-3"
                      : "block h-24 bg-[#eef4ff] p-3"
                  }
                >
                  <span
                    className={
                      option.value === "dark"
                        ? "block h-full rounded-lg border border-slate-700/80 bg-[#111A38]"
                        : "block h-full rounded-lg border border-blue-200 bg-white"
                    }
                  >
                    <span className="mt-4 block h-2 w-2/3 rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500" />
                    <span
                      className={
                        option.value === "dark"
                          ? "mt-3 block h-2 w-1/2 rounded-full bg-slate-700"
                          : "mt-3 block h-2 w-1/2 rounded-full bg-slate-200"
                      }
                    />
                  </span>
                </span>
              </span>
              <span className="mt-4 flex items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {option.description}
                  </span>
                </span>
                <span
                  className={
                    selected
                      ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 text-white"
                      : "h-5 w-5 shrink-0 rounded-full border border-slate-300 dark:border-slate-600"
                  }
                  aria-hidden="true"
                >
                  {selected ? (
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                      <path
                        d="m2.5 6 2.2 2.2 4.8-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
