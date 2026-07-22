import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountInformationCard } from "@/components/AccountInformationCard";
import { PageContainer } from "@/components/PageContainer";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { Sidebar } from "@/components/Sidebar";
import { getProfile } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

export default async function ProfileSettingsPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const profile = await getProfile(token);

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-medium text-neutral-500">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
            Profile & Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Manage your professional profile and default interview preferences.
          </p>
        </section>

        {profile ? (
          <div className="mt-6 space-y-6">
            <ProfileSettingsForm initialProfile={profile} />
            <AccountInformationCard
              account={profile.account}
              profile={profile.profile}
            />
          </div>
        ) : (
          <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-950">
              Profile settings unavailable
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              HireMind could not load your profile settings. Refresh the page or
              try again after checking the backend service.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Back to Dashboard
            </Link>
          </section>
        )}
      </PageContainer>
    </div>
  );
}
