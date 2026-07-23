import Link from "next/link";
import { HireMindLogo } from "@/components/HireMindLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/62">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950"
        >
          <HireMindLogo size="sm" />
        </Link>
        <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Link
            href="/dashboard"
            className="rounded-xl px-3 py-2 font-medium hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:bg-slate-800/70 dark:hover:text-cyan-200 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 font-semibold text-slate-800 hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-100 dark:hover:border-cyan-400/50 dark:hover:bg-slate-800/75 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950"
          >
            Login
          </Link>
          <div className="hidden w-36 sm:block">
            <ThemeToggle compact />
          </div>
        </nav>
      </div>
    </header>
  );
}
