import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader, Skeleton } from "@/components/ui";

export default function StartInterviewLoading() {
  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar />
      <PageContainer>
        <PageHeader
          eyebrow="Practice setup"
          title="Preparing interview setup"
          description="Loading resume context and available interview options."
        />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Skeleton className="h-72" />
            <Skeleton className="h-80" />
            <Skeleton className="h-52" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    </div>
  );
}
