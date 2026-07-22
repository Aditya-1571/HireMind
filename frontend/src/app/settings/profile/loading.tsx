import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";

export default function ProfileSettingsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-medium text-neutral-500">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
            Profile & Settings
          </h1>
          <p className="mt-4 text-sm text-neutral-600">
            Loading profile settings...
          </p>
        </section>
      </PageContainer>
    </div>
  );
}
