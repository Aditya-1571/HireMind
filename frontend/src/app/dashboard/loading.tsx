import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { Card, PageHeader, Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar />
      <PageContainer className="py-10">
        <PageHeader
          eyebrow="Dashboard"
          title="Preparing your workspace"
          description="Loading your interviews, resume status, and performance analytics."
        />
        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </section>
        <Card className="mt-8 p-7">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-5 h-24" />
        </Card>
      </PageContainer>
    </div>
  );
}
