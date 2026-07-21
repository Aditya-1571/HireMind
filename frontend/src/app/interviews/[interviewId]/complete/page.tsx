import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Sidebar } from "@/components/Sidebar";
import { getInterview } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/auth";

type CompletePageProps = {
  params: Promise<{ interviewId: string }>;
  searchParams?: Promise<{ source?: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not completed";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(seconds: number | null, startedAt: string | null, completedAt: string | null) {
  let totalSeconds = seconds;
  if (totalSeconds === null && startedAt && completedAt) {
    totalSeconds = Math.max(
      0,
      Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000),
    );
  }
  if (totalSeconds === null) {
    return "Not available";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatEvaluationStyle(style: string) {
  return style
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function InterviewCompletePage({
  params,
  searchParams,
}: CompletePageProps) {
  const { interviewId } = await params;
  const source = (await searchParams)?.source;
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  if (!user || !token) {
    redirect("/login");
  }

  const interview = await getInterview(token, interviewId);

  if (!interview) {
    notFound();
  }

  const evaluationLabel =
    source === "ai"
      ? "AI evaluated"
      : source === "fallback"
        ? "Standard evaluation"
        : null;
  const questionEvaluations = new Map(
    interview.question_evaluations.map((evaluation) => [
      evaluation.sequence_number,
      evaluation,
    ]),
  );

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <Sidebar />
      <PageContainer className="py-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm font-medium text-neutral-500">
            Interview Complete
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">
            Summary
          </h1>
          {evaluationLabel ? (
            <p className="mt-2 text-sm font-medium text-neutral-600">
              {evaluationLabel}
            </p>
          ) : null}
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Interview type</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.interview_type}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Difficulty</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.difficulty}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Target role</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.target_role}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Answered questions</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.answered_count} of {interview.total_questions}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Question count</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.question_count}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Evaluation style</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {formatEvaluationStyle(interview.evaluation_style)}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Time limit</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {interview.time_limit_minutes
                  ? `${interview.time_limit_minutes} minutes`
                  : "Unlimited"}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Duration</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {formatDuration(
                  interview.duration_seconds,
                  interview.started_at,
                  interview.completed_at,
                )}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Completion date</dt>
              <dd className="mt-1 font-medium text-neutral-950">
                {formatDate(interview.completed_at)}
              </dd>
            </div>
          </dl>

          <section className="mt-8 border-t border-neutral-200 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  Evaluation
                </p>
                <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                  {interview.overall_score ?? "Not available"} / 100
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-700">
              {interview.overall_feedback ?? "Evaluation feedback is not available."}
            </p>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Strengths
              </h2>
              {interview.strengths.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                  {interview.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">Not found</p>
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Areas for improvement
              </h2>
              {interview.improvements.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                  {interview.improvements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">Not found</p>
              )}
            </div>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-base font-semibold text-neutral-950">
              Question feedback
            </h2>
            {interview.questions
              .slice()
              .sort(
                (first, second) =>
                  first.sequence_number - second.sequence_number,
              )
              .map((question) => {
                const evaluation = questionEvaluations.get(
                  question.sequence_number,
                );
                return (
                  <article
                    key={question.id}
                    className="rounded-md border border-neutral-200 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-sm font-semibold text-neutral-950">
                        Question {question.sequence_number}
                      </h3>
                      <p className="text-sm font-medium text-neutral-700">
                        {question.score ?? evaluation?.score ?? "N/A"} / 10
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-medium text-neutral-900">
                      {question.question_text}
                    </p>
                    <p className="mt-3 text-sm text-neutral-700">
                      {question.user_answer ?? "No answer recorded."}
                    </p>
                    <p className="mt-4 text-sm text-neutral-700">
                      {question.feedback ??
                        evaluation?.feedback ??
                        "Feedback is not available."}
                    </p>
                    {evaluation ? (
                      <div className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-neutral-950">
                            Strength:
                          </span>{" "}
                          {evaluation.strength}
                        </p>
                        <p>
                          <span className="font-medium text-neutral-950">
                            Improve:
                          </span>{" "}
                          {evaluation.improvement}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
          </section>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Back to Dashboard
          </Link>
        </section>
      </PageContainer>
    </div>
  );
}
