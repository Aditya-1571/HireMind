import type { InterviewReport as InterviewReportType } from "@/lib/api";
import { InterviewReportActions } from "@/components/InterviewReportActions";

type InterviewReportProps = {
  report: InterviewReportType;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "Not available";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatStyle(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function scoreLabel(value: number | null, suffix: string) {
  return value === null ? "Not available" : `${value}${suffix}`;
}

function ListSection({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-neutral-500">Not found</p>;
  }

  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function InterviewReport({ report }: InterviewReportProps) {
  const metadata = [
    ["Target role", report.interview.target_role],
    ["Interview date", formatDate(report.interview.completed_at)],
    ["Interview type", report.interview.interview_type],
    ["Difficulty", report.interview.difficulty],
    ["Evaluation style", formatStyle(report.interview.evaluation_style)],
    ["Question count", String(report.interview.question_count)],
    ["Answered", `${report.interview.answered_count} of ${report.metrics.total_questions}`],
    ["Duration", formatDuration(report.interview.duration_seconds)],
    [
      "Time limit",
      report.interview.time_limit_minutes
        ? `${report.interview.time_limit_minutes} minutes`
        : "Unlimited",
    ],
  ];

  return (
    <div className="space-y-6">
      <InterviewReportActions report={report} />

      <article className="report-print-area rounded-lg border border-neutral-200 bg-white p-6">
        <header className="border-b border-neutral-200 pb-6">
          <p className="text-sm font-medium text-neutral-500">
            Professional Interview Report
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-neutral-950">
                HireMind Interview Report
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                {report.interview.target_role} - {report.interview.interview_type} -{" "}
                {report.interview.difficulty}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-4 lg:min-w-48">
              <p className="text-sm text-neutral-500">Overall score</p>
              <p className="mt-1 text-3xl font-semibold text-neutral-950">
                {scoreLabel(report.summary.overall_score, "/100")}
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-700">
                {report.summary.performance_level ?? "Not available"}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metadata.map(([label, value]) => (
              <div key={label} className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs font-medium uppercase text-neutral-500">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-medium text-neutral-950">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">
            Performance Summary
          </h2>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            {report.summary.overall_feedback ??
              "Overall feedback is not available for this interview."}
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                Strengths
              </h3>
              <ListSection items={report.summary.strengths} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                Areas for improvement
              </h3>
              <ListSection items={report.summary.improvements} />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">
            Transparent Metrics
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Average question score</dt>
              <dd className="mt-1 font-semibold text-neutral-950">
                {scoreLabel(report.metrics.average_question_score, "/10")}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Completion rate</dt>
              <dd className="mt-1 font-semibold text-neutral-950">
                {scoreLabel(report.metrics.completion_rate, "%")}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Answered questions</dt>
              <dd className="mt-1 font-semibold text-neutral-950">
                {report.metrics.answered_questions}
              </dd>
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <dt className="text-sm text-neutral-500">Total questions</dt>
              <dd className="mt-1 font-semibold text-neutral-950">
                {report.metrics.total_questions}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">
            Question-by-Question Review
          </h2>
          <div className="mt-4 space-y-4">
            {report.questions.length === 0 ? (
              <p className="rounded-md border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                No stored questions are available for this interview.
              </p>
            ) : (
              report.questions.map((question) => (
                <article
                  key={question.sequence_number}
                  className="report-question rounded-md border border-neutral-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-base font-semibold text-neutral-950">
                      Question {question.sequence_number}
                    </h3>
                    <p className="text-sm font-semibold text-neutral-700">
                      {scoreLabel(question.score, "/10")}
                    </p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-neutral-950">
                    {question.question_text}
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-neutral-700">
                      Candidate answer
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700">
                      {question.candidate_answer || "No answer recorded."}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        Feedback
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {question.feedback ?? "Not available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        Strength
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {question.strength || "Not found"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        Improvement
                      </p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {question.improvement || "Not found"}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">
            Recommendations
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                Focus topics
              </h3>
              <ListSection items={report.recommendations.topics} />
            </div>
            <div className="rounded-md border border-neutral-200 p-4">
              <h3 className="text-base font-semibold text-neutral-950">
                Next practice recommendation
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Target role</dt>
                  <dd className="font-medium text-neutral-950">
                    {report.recommendations.next_interview.target_role}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Difficulty</dt>
                  <dd className="font-medium text-neutral-950">
                    {report.recommendations.next_interview.difficulty}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Interview type</dt>
                  <dd className="font-medium text-neutral-950">
                    {report.recommendations.next_interview.interview_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Question count</dt>
                  <dd className="font-medium text-neutral-950">
                    {report.recommendations.next_interview.question_count}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
