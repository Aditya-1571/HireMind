import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InterviewReport } from "@/components/InterviewReport";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { getInterviewReport } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

type CompletePageProps = {
  params: Promise<{ interviewId: string }>;
};

export default async function InterviewCompletePage({
  params,
}: CompletePageProps) {
  const { interviewId } = await params;
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const result = await getInterviewReport(token, interviewId);

  if (!result.ok) {
    if (result.status === 404) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-neutral-50 md:flex">
        <div className="print-hidden">
          <Sidebar />
        </div>
        <PageContainer className="py-8">
          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm font-medium text-neutral-500">
              Interview Report
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-950">
              Report unavailable
            </h1>
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              {result.status === 409
                ? "Complete the interview before viewing the report."
                : result.message}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/interviews/history"
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Back to History
              </Link>
              <Link
                href={`/interviews/${interviewId}`}
                className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Continue Interview
              </Link>
            </div>
          </section>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <div className="print-hidden">
        <Sidebar />
      </div>
      <PageContainer className="py-8">
        <InterviewReport report={result.report} />
      </PageContainer>
    </div>
  );
}
