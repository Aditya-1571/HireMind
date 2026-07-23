import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader, Skeleton } from "@/components/ui";

export default function ProfileSettingsLoading() {
  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <PageHeader
          eyebrow="Settings"
          title="Profile & Settings"
          description="Loading profile settings..."
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-[32rem]" />
        </div>
      </PageContainer>
    </div>
  );
}
