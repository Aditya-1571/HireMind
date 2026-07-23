import { notFound, redirect } from "next/navigation";
import { InterviewReport } from "@/components/InterviewReport";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { Card, LinkButton } from "@/components/ui";
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
      <div className="hiremind-ambient min-h-screen md:flex">
        <div className="print-hidden">
          <Sidebar user={user} />
        </div>
        <PageContainer className="py-8">
          <Card className="p-6">
            <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
              Interview Report
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              Report unavailable
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {result.status === 409
                ? "Complete the interview before viewing the report."
                : result.message}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <LinkButton href="/interviews/history">
                Back to History
              </LinkButton>
              <LinkButton href={`/interviews/${interviewId}`} variant="primary">
                Continue Interview
              </LinkButton>
            </div>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <div className="print-hidden">
        <Sidebar user={user} />
      </div>
      <PageContainer className="py-8">
        <InterviewReport report={result.report} />
      </PageContainer>
    </div>
  );
}
