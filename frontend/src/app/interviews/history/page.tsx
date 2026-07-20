import { Suspense } from "react";
import { redirect } from "next/navigation";
import { InterviewHistoryClient } from "@/components/InterviewHistoryClient";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

export default async function InterviewHistoryPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-medium text-neutral-500">Interviews</p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
            Interview History
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Review previous interview sessions, continue active practice, and
            revisit completed results.
          </p>
        </section>

        <Suspense
          fallback={
            <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
              <p className="text-sm text-neutral-600">Loading interviews...</p>
            </section>
          }
        >
          <InterviewHistoryClient />
        </Suspense>
      </PageContainer>
    </div>
  );
}
