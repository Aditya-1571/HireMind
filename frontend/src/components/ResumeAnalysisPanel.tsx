"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resume, ResumeAnalysis } from "@/lib/api";

type ResumeAnalysisPanelProps = {
  resume: Resume;
};

function EmptyState() {
  return <p className="mt-2 text-sm text-neutral-500">Not found</p>;
}

function TextValue({ value }: { value: string | null }) {
  return value ? (
    <p className="mt-2 text-sm leading-6 text-neutral-700">{value}</p>
  ) : (
    <EmptyState />
  );
}

function ListValue({ values }: { values: string[] }) {
  return values.length > 0 ? (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-700">
      {values.map((value) => (
        <li key={value}>{value}</li>
      ))}
    </ul>
  ) : (
    <EmptyState />
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-neutral-200 pt-4">
      <h3 className="text-sm font-semibold text-neutral-950">{title}</h3>
      {children}
    </div>
  );
}

export function ResumeAnalysisPanel({ resume }: ResumeAnalysisPanelProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const analysis = resume.analysis_data as ResumeAnalysis | null;
  const canAnalyze = resume.processing_status === "ready";

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/resumes/${resume.id}/analysis`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          message?: unknown;
        };
        setMessage(
          typeof error.message === "string"
            ? error.message
            : "Resume analysis failed.",
        );
        setIsAnalyzing(false);
        router.refresh();
        return;
      }

      setMessage("Resume analysis is ready.");
      router.refresh();
    } catch {
      setMessage("Resume analysis is unavailable.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mt-5 rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-700">
            Structured Resume Analysis
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Status: {resume.analysis_status}
          </p>
        </div>
        {canAnalyze ? (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
          </button>
        ) : null}
      </div>

      {message ? (
        <p
          className={
            message.includes("failed") || message.includes("unavailable")
              ? "mt-3 text-sm text-red-600"
              : "mt-3 text-sm text-green-700"
          }
        >
          {message}
        </p>
      ) : null}

      {resume.analysis_status === "failed" ? (
        <p className="mt-3 text-sm text-red-600">Resume analysis failed.</p>
      ) : null}

      {analysis ? (
        <div className="mt-5 space-y-4">
          <Section title="Contact information">
            <div className="mt-2 grid gap-2 text-sm text-neutral-700 sm:grid-cols-3">
              <p>Name: {analysis.candidate_name ?? "Not found"}</p>
              <p>Email: {analysis.email ?? "Not found"}</p>
              <p>Phone: {analysis.phone ?? "Not found"}</p>
            </div>
          </Section>
          <Section title="Skills">
            <ListValue
              values={[
                ...analysis.skills,
                ...analysis.programming_languages,
                ...analysis.frameworks_and_libraries,
                ...analysis.tools_and_platforms,
              ].filter((value, index, values) => values.indexOf(value) === index)}
            />
          </Section>
          <Section title="Summary">
            <TextValue value={analysis.summary} />
          </Section>
          <Section title="Education">
            <ListValue values={analysis.education} />
          </Section>
          <Section title="Experience">
            <ListValue values={analysis.experience} />
          </Section>
          <Section title="Projects">
            <ListValue values={analysis.projects} />
          </Section>
          <Section title="Certifications">
            <ListValue values={analysis.certifications} />
          </Section>
        </div>
      ) : null}
    </div>
  );
}
