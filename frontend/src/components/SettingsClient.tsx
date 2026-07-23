"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ProfileResponse } from "@/lib/api";
import { Skeleton } from "@/components/ui";

type SettingsTab = "profile" | "account" | "appearance";

type SettingsClientProps = {
  profile: ProfileResponse;
};

const tabs: Array<{
  id: SettingsTab;
  label: string;
  description: string;
}> = [
  {
    id: "profile",
    label: "Profile",
    description: "Professional details used across your preparation workspace.",
  },
  {
    id: "account",
    label: "Account",
    description: "Read-only Google identity and current session controls.",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Light and dark mode preferences for this browser.",
  },
];

function normalizeTab(value: string | null): SettingsTab {
  return value === "account" || value === "appearance" ? value : "profile";
}

const ProfileSettingsForm = dynamic(
  () =>
    import("@/components/ProfileSettingsForm").then(
      (module) => module.ProfileSettingsForm,
    ),
  {
    loading: () => <Skeleton className="h-[32rem]" />,
  },
);

const AccountInformationCard = dynamic(
  () =>
    import("@/components/AccountInformationCard").then(
      (module) => module.AccountInformationCard,
    ),
  {
    loading: () => <Skeleton className="h-96" />,
  },
);

const AppearanceSettingsPanel = dynamic(
  () =>
    import("@/components/AppearanceSettingsPanel").then(
      (module) => module.AppearanceSettingsPanel,
    ),
  {
    loading: () => <Skeleton className="h-72" />,
  },
);

export function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = normalizeTab(searchParams.get("tab"));

  const setTab = (tab: SettingsTab) => {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === "profile") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const selectRelativeTab = (current: SettingsTab, direction: 1 | -1) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === current);
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    setTab(tabs[nextIndex].id);
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <nav
          aria-label="Settings sections"
          role="tablist"
          className="grid gap-2 rounded-2xl border border-slate-200/75 bg-white/72 p-2 shadow-sm shadow-blue-950/[0.04] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/58"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                onClick={() => setTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                    event.preventDefault();
                    selectRelativeTab(tab.id, 1);
                  }
                  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    selectRelativeTab(tab.id, -1);
                  }
                }}
                aria-selected={selected}
                aria-controls="settings-panel"
                className={
                  selected
                    ? "rounded-xl bg-gradient-to-r from-blue-600 to-fuchsia-500 px-4 py-3 text-left text-white shadow-sm shadow-blue-950/20"
                    : "rounded-xl px-4 py-3 text-left text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-cyan-200 dark:focus-visible:ring-cyan-300"
                }
              >
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span
                  className={
                    selected
                      ? "mt-1 block text-xs leading-5 text-blue-50"
                      : "mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400"
                  }
                >
                  {tab.description}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section id="settings-panel" role="tabpanel" tabIndex={-1}>
        {activeTab === "profile" ? (
          <ProfileSettingsForm initialProfile={profile} />
        ) : null}
        {activeTab === "account" ? (
          <AccountInformationCard
            account={profile.account}
            profile={profile.profile}
          />
        ) : null}
        {activeTab === "appearance" ? <AppearanceSettingsPanel /> : null}
      </section>
    </div>
  );
}
