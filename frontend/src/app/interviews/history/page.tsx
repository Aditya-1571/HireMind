import { Suspense } from "react";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader, Skeleton } from "@/components/ui";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

const InterviewHistoryClient = dynamic(
  () =>
    import("@/components/InterviewHistoryClient").then(
      (module) => module.InterviewHistoryClient,
    ),
  {
    loading: () => <HistoryFallback />,
  },
);

export default async function InterviewHistoryPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar user={user} />
      <PageContainer className="py-8">
        <PageHeader
          eyebrow="Interviews"
          title="Interview History"
          description="Review previous interview sessions, continue active practice, and revisit completed reports."
        />

        <Suspense
          fallback={<HistoryFallback />}
        >
          <InterviewHistoryClient />
        </Suspense>
      </PageContainer>
    </div>
  );
}

function HistoryFallback() {
  return (
    <section
      aria-label="Loading interview history"
      className="mt-6 rounded-2xl border border-slate-200/75 bg-white/80 p-6 shadow-sm dark:border-slate-700/55 dark:bg-slate-900/58"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </section>
  );
}
