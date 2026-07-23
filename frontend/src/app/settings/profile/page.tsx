import { redirect } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { EmptyState, LinkButton, PageHeader, Skeleton } from "@/components/ui";
import { getProfile } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

const SettingsClient = dynamic(
  () =>
    import("@/components/SettingsClient").then(
      (module) => module.SettingsClient,
    ),
  {
    loading: () => <SettingsFallback />,
  },
);

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
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}
