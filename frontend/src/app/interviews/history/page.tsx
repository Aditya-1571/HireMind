import { Suspense } from "react";
import { redirect } from "next/navigation";
import { InterviewHistoryClient } from "@/components/InterviewHistoryClient";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/ui";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

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
          fallback={
            <section className="mt-6 rounded-2xl border border-slate-200/75 bg-white/80 p-6 shadow-sm dark:border-slate-700/55 dark:bg-slate-900/58">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 h-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </section>
          }
        >
          <InterviewHistoryClient />
        </Suspense>
      </PageContainer>
    </div>
  );
}
