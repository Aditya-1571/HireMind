import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SettingsClient } from "@/components/SettingsClient";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { getProfile } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

export default async function ProfileSettingsPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const profile = await getProfile(token);

  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar user={user} />
      <PageContainer className="py-8">
        <PageHeader
          eyebrow="Settings"
          title="Profile & Settings"
          description="Manage your professional profile, account identity, and appearance preferences."
        />

        {profile ? (
          <Suspense fallback={<SettingsFallback />}>
            <SettingsClient profile={profile} />
          </Suspense>
        ) : (
          <EmptyState
            className="mt-6 bg-white"
            title="Profile settings unavailable"
            description="HireMind could not load your profile settings. Refresh the page or try again after checking the backend service."
            action={<LinkButton href="/dashboard">Back to Dashboard</LinkButton>}
          />
        )}
      </PageContainer>
    </div>
  );
}

function SettingsFallback() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr]">
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
      <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
    </div>
  );
}
