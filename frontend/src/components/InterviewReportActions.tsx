"use client";

import Link from "next/link";
import type { InterviewReport } from "@/lib/api";

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
    <section className="print-hidden rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-700">Report actions</p>
          <p className="mt-1 text-sm text-neutral-500">
            Suggested filename: {suggestedFilename}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            For Save as PDF, choose Save as PDF in the destination options.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/interviews/history"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Back to History
          </Link>
          <Link
            href={practiceAgainHref(report)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Practice Again
          </Link>
          <button
            type="button"
            onClick={printReport}
            className="rounded-md bg-neutral-950 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Print Report
          </button>
          <button
            type="button"
            onClick={printReport}
            className="rounded-md bg-neutral-950 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Save as PDF
          </button>
        </div>
      </div>
    </section>
  );
}
