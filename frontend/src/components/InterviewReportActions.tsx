"use client";

import type { InterviewReport } from "@/lib/api";
import { Button, Card, LinkButton } from "@/components/ui";

type InterviewReportActionsProps = {
  report: InterviewReport;
};

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function reportDate(value: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  return new Date(value).toISOString().slice(0, 10);
}

function practiceAgainHref(report: InterviewReport) {
  const params = new URLSearchParams({
    role: report.interview.target_role,
    difficulty: report.interview.difficulty,
    interview_type: report.interview.interview_type,
    question_count: String(report.interview.question_count),
    evaluation_style: report.interview.evaluation_style,
    time_limit_minutes:
      report.interview.time_limit_minutes === null
        ? ""
        : String(report.interview.time_limit_minutes),
    answer_mode: report.interview.answer_mode,
  });
  return `/interviews/start?${params.toString()}`;
}

export function InterviewReportActions({ report }: InterviewReportActionsProps) {
  const suggestedFilename = `HireMind-Interview-Report-${sanitizeFilenamePart(
    report.interview.target_role,
  )}-${reportDate(report.interview.completed_at)}.pdf`;

  const printReport = () => {
    window.print();
  };

  return (
    <Card className="print-hidden p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Report actions</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Suggested filename: {suggestedFilename}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            For Save as PDF, choose Save as PDF in the destination options.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/interviews/history">
            Back to History
          </LinkButton>
          <LinkButton href={practiceAgainHref(report)}>
            Practice Again
          </LinkButton>
          <Button onClick={printReport}>
            Print Report
          </Button>
          <Button onClick={printReport}>
            Save as PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
