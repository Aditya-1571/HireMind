"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";
import { HireMindLogo } from "@/components/HireMindLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

type SidebarProps = {
  user?: AuthUser | null;
};

const navigationGroups = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: DashboardIcon }],
  },
  {
    label: "Prepare",
    items: [
      { href: "/interviews/start", label: "Start Interview", icon: StartIcon },
      { href: "/dashboard#resume", label: "Resume", icon: ResumeIcon },
    ],
  },
  {
    label: "Practice",
    items: [{ href: "/interviews/history", label: "History", icon: HistoryIcon }],
  },
  {
    label: "Profile",
    items: [
      { href: "/settings/profile", label: "Settings", icon: SettingsIcon },
      { href: "/settings/profile?tab=account", label: "Account", icon: AccountIcon },
    ],
  },
];

function isActive(pathname: string, href: string, settingsTab: string | null) {
  if (href === "/settings/profile") {
    return pathname === "/settings/profile" && settingsTab !== "account";
  }
  if (href === "/settings/profile?tab=account") {
    return pathname === "/settings/profile" && settingsTab === "account";
  }
  if (href.includes("?") || href.includes("#")) {
    return false;
  }
  const [path] = href.split("#");
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

function initials(user?: AuthUser | null) {
  const source = user?.name || user?.email || "HireMind";
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [settingsTab, setSettingsTab] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const syncTab = () => {
      setSettingsTab(new URLSearchParams(window.location.search).get("tab"));
    };
    syncTab();
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, [pathname]);

  const signOut = async () => {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const nav = (
    <>
      <div className="px-4 py-5">
        <Link
          href="/"
          className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          onClick={() => setMobileOpen(false)}
        >
          <HireMindLogo subtitle />
        </Link>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 space-y-5 px-3">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              {group.label}
            </p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href, settingsTab);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      setSettingsTab(
                        item.href.includes("tab=account") ? "account" : null,
                      );
                      setMobileOpen(false);
                    }}
                    className={
                      active
                        ? "flex items-center gap-3 rounded-xl border border-blue-400/25 bg-gradient-to-r from-blue-600 to-fuchsia-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/25"
                        : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-cyan-200 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950"
                    }
                  >
                    <Icon />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-4 px-3 pb-4 pt-5">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
            Preferences
          </p>
          <div className="mt-2">
            <ThemeToggle />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/75 bg-white/80 p-3 shadow-sm shadow-blue-950/[0.04] dark:border-slate-700/55 dark:bg-slate-900/55 dark:shadow-none">
          <Link
            href="/settings/profile?tab=account"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-cyan-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-semibold text-white">
              {user?.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile_picture}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(user)
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                {user?.name || "HireMind user"}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email || "Account settings"}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="mt-3 w-full rounded-xl border border-slate-200/80 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700/70 dark:bg-slate-950/30 dark:text-slate-200 dark:hover:border-red-400/30 dark:hover:bg-red-950/25 dark:hover:text-red-200"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <header className="print-hidden sticky top-0 z-40 border-b border-slate-200/70 bg-white/82 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/72 md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-xl">
            <HireMindLogo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar"
            className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <aside className="print-hidden hidden min-h-screen w-72 shrink-0 border-r border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/58 md:sticky md:top-0 md:flex md:flex-col">
        {nav}
      </aside>

      {mobileOpen ? (
        <div
          id="mobile-sidebar"
          className="print-hidden fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm md:hidden"
        >
          <div className="flex h-full w-[min(22rem,88vw)] flex-col border-r border-slate-200/70 bg-white/95 shadow-2xl shadow-blue-950/20 dark:border-slate-800 dark:bg-slate-950/95">
            {nav}
          </div>
        </div>
      ) : null}
    </>
  );
}

function DashboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path d="M3 10.5h5.5V3H3v7.5ZM11.5 17H17V9.5h-5.5V17ZM3 17h5.5v-4H3v4ZM11.5 6.5H17V3h-5.5v3.5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path d="m7.5 5 6 5-6 5V5Z" fill="currentColor" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path d="M5 2.8h6l4 4V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 3v4h4M7 11h6M7 14h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path d="M4 4v4h4M4.4 8A6.5 6.5 0 1 1 5.8 14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M10 6.5V10l2.5 1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path d="M10 12.7a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.5 11.2V8.8l-2-.5a5.4 5.4 0 0 0-.6-1.4l1.1-1.8-1.7-1.7-1.8 1.1a5.4 5.4 0 0 0-1.4-.6l-.5-2H8.4l-.5 2a5.4 5.4 0 0 0-1.4.6L4.7 3.4 3 5.1l1.1 1.8a5.4 5.4 0 0 0-.6 1.4l-2 .5v2.4l2 .5c.1.5.3 1 .6 1.4L3 14.9l1.7 1.7 1.8-1.1c.4.3.9.5 1.4.6l.5 2h2.4l.5-2c.5-.1 1-.3 1.4-.6l1.8 1.1 1.7-1.7-1.1-1.8c.3-.4.5-.9.6-1.4l2-.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM4 17a6 6 0 0 1 12 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
