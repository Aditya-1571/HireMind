import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui";

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
      </PageContainer>
    </div>
  );
}
