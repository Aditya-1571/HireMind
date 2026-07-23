import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader, Skeleton } from "@/components/ui";

export default function InterviewHistoryLoading() {
  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar />
      <PageContainer>
        <PageHeader
          eyebrow="History"
          title="Loading interview history"
          description="Preparing your filters and past interview summaries."
        />
        <div className="mt-6 rounded-[1.35rem] border border-slate-200/70 p-6 dark:border-slate-700/45">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
