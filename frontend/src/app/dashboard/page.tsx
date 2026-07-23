import Link from "next/link";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { PerformanceTrendChart } from "@/components/PerformanceTrendChart";
import { Sidebar } from "@/components/Sidebar";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  Skeleton,
  StatCard,
} from "@/components/ui";
import {
  getAiHealth,
  getInterviewAnalyticsSummary,
  getInterviewSummaries,
  getResumes,
} from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

const statusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

const OllamaStatusPanel = dynamic(
  () =>
    import("@/components/OllamaStatusPanel").then(
      (module) => module.OllamaStatusPanel,
    ),
  {
    loading: () => <Skeleton className="mt-6 h-40" />,
  },
);

const ResumeUploadForm = dynamic(
  () =>
    import("@/components/ResumeUploadForm").then(
      (module) => module.ResumeUploadForm,
    ),
  {
    loading: () => <Skeleton className="mt-5 h-32" />,
  },
);

const ResumeAnalysisPanel = dynamic(
  () =>
    import("@/components/ResumeAnalysisPanel").then(
      (module) => module.ResumeAnalysisPanel,
    ),
  {
    loading: () => <Skeleton className="mt-5 h-48" />,
  },
);

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getResumeStatusLabel(status?: string) {
  if (!status) {
    return "Not uploaded";
  }

  return statusLabels[status] ?? "Uploaded";
}

function getPreview(text: string) {
  return text.length > 280 ? `${text.slice(0, 280).trim()}...` : text;
}

function formatDate(value: string | null) {
  if (!value) {
    return "In progress";
  }

  return dateTimeFormatter.format(new Date(value));
}

export default async function DashboardPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const [resumes, recentInterviews, analytics, aiHealth] = await Promise.all([
    getResumes(token),
    getInterviewSummaries(token, {
      page: 1,
      page_size: 5,
      sort: "newest",
    }),
    getInterviewAnalyticsSummary(token),
    getAiHealth(),
  ]);
  const latestResume = resumes[0];
  const stats = [
    {
      label: "Resume Status",
      value: getResumeStatusLabel(latestResume?.processing_status),
    },
    {
      label: "Total Interviews",
      value: String(analytics?.total_interviews ?? recentInterviews.total),
    },
    {
      label: "Average Score",
      value:
        analytics?.average_completed_score === null ||
        analytics?.average_completed_score === undefined
          ? "N/A"
          : `${analytics.average_completed_score}/100`,
    },
  ];

  return (
    <div className="hiremind-ambient min-h-screen md:flex">
      <Sidebar user={user} />
      <PageContainer className="py-10">
        <PageHeader
          eyebrow="Dashboard"
          title={user ? `Welcome, ${user.name}` : "Welcome to HireMind"}
          description="Track interview readiness, review practice sessions, and choose the next best action for your preparation."
          action={
            <LinkButton href="/interviews/start" variant="primary">
              Start interview
            </LinkButton>
          }
        />

        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </section>

        <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Completed" value={String(analytics?.completed_interviews ?? 0)} />
          <StatCard label="In Progress" value={String(analytics?.in_progress_interviews ?? 0)} />
          <StatCard
            label="Highest Score"
            value={
              analytics?.highest_score === null ||
              analytics?.highest_score === undefined
                ? "N/A"
                : `${analytics.highest_score}/100`
            }
          />
          <StatCard
            label="Latest Score"
            value={
              analytics?.latest_completed_score === null ||
              analytics?.latest_completed_score === undefined
                ? "N/A"
                : `${analytics.latest_completed_score}/100`
            }
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-7">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
              Score Trend
            </h2>
            <div className="mt-5">
              <PerformanceTrendChart items={analytics?.score_trend ?? []} />
            </div>
          </Card>
          <Card className="p-7">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
              Practice Focus
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Most-practised role:{" "}
              <span className="font-medium text-slate-950 dark:text-slate-50">
                {analytics?.most_practised_target_role ?? "Not available"}
              </span>
            </p>
            <div className="mt-5 space-y-3">
              {(analytics?.average_score_by_type ?? []).length > 0 ? (
                (analytics?.average_score_by_type ?? []).map((item) => (
                  <div key={item.interview_type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {item.interview_type}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.average_score}/100
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                        style={{ width: `${item.average_score}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No completed scored interviews yet.
                </p>
              )}
            </div>
          </Card>
        </section>

        <OllamaStatusPanel health={aiHealth} />

        <Card id="resume" className="mt-8 scroll-mt-6 p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                Resume Upload
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Upload a resume so HireMind can tailor interview prep and
                evaluation to the candidate profile.
              </p>
            </div>
            {latestResume ? (
              <Badge>
                {getResumeStatusLabel(latestResume.processing_status)}
              </Badge>
            ) : null}
          </div>
          <ResumeUploadForm />
          {latestResume ? (
            <div className="mt-5 rounded-2xl border border-slate-200/75 bg-blue-50/45 p-4 dark:border-slate-700/60 dark:bg-slate-950/30">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Latest resume
              </p>
              <p className="mt-1 break-words text-sm text-slate-950 dark:text-slate-50">
                {latestResume.original_filename}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Status: {getResumeStatusLabel(latestResume.processing_status)}
              </p>
              {latestResume.processing_status === "ready" &&
              latestResume.extracted_text ? (
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {getPreview(latestResume.extracted_text)}
                </p>
              ) : null}
              {latestResume.processing_status === "failed" ? (
                <p className="mt-3 text-sm text-red-600 dark:text-red-300">
                  No readable resume text could be extracted.
                </p>
              ) : null}
              {latestResume.processing_status === "processing" ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Resume text extraction is in progress.
                </p>
              ) : null}
              {latestResume.processing_status === "ready" ? (
                <ResumeAnalysisPanel resume={latestResume} />
              ) : null}
            </div>
          ) : null}
        </Card>

        <Card className="mt-8 p-7">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
            Recent Interviews
          </h2>
          {recentInterviews.interviews.length > 0 ? (
            <div className="mt-5 divide-y divide-slate-200/70 dark:divide-slate-800">
              {recentInterviews.interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
                      {interview.interview_type} - {interview.difficulty}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {interview.target_role}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {interview.answered_count} of {interview.total_questions}{" "}
                      answered
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {interview.question_count} questions requested
                    </p>
                    {interview.overall_score !== null ? (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Score: {interview.overall_score}/100
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 text-sm sm:items-end">
                    <span className="text-slate-500 dark:text-slate-400">
                      {interview.status === "completed"
                        ? formatDate(interview.completed_at)
                        : "In progress"}
                    </span>
                    <Link
                      href={
                        interview.status === "completed"
                          ? `/interviews/${interview.id}/complete`
                          : `/interviews/${interview.id}`
                      }
                      className="font-medium text-blue-700 hover:underline dark:text-cyan-200"
                    >
                      {interview.status === "completed"
                        ? "View Report"
                        : "Continue Interview"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              title="No interviews yet"
              description="Start your first interview to see recent activity, scores, and next actions here."
              action={
                <LinkButton href="/interviews/start" variant="primary">
                  Start interview
                </LinkButton>
              }
            />
          )}
        </Card>
      </PageContainer>
    </div>
  );
}
