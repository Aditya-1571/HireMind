import { redirect } from "next/navigation";
import { AccountInformationCard } from "@/components/AccountInformationCard";
import { PageContainer } from "@/components/PageContainer";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
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
          description="Manage your professional profile and default interview preferences."
        />

        {profile ? (
          <div className="mt-6 space-y-6">
            <ProfileSettingsForm initialProfile={profile} />
            <AccountInformationCard
              account={profile.account}
              profile={profile.profile}
            />
          </div>
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
