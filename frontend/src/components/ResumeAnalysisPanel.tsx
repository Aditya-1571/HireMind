"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Resume,
  ResumeAnalysis,
  ResumeExperience,
  ResumeProject,
  ResumeSkillCategories,
} from "@/lib/api";

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

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isProject(value: unknown): value is ResumeProject {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "description" in value &&
    "technologies" in value
  );
}

function isExperience(value: unknown): value is ResumeExperience {
  return (
    typeof value === "object" &&
    value !== null &&
    "organization" in value &&
    "description" in value &&
    "experience_type" in value
  );
}

function categorizedSkills(analysis: ResumeAnalysis): ResumeSkillCategories {
  if (analysis.skills_categorized) {
    return analysis.skills_categorized;
  }
  if (!Array.isArray(analysis.skills) && analysis.skills) {
    return analysis.skills;
  }
  return {
    programming_languages: analysis.programming_languages,
    frameworks_libraries: analysis.frameworks_and_libraries,
    tools_platforms: analysis.tools_and_platforms,
    ml_ai: analysis.ml_ai ?? [],
    databases: analysis.databases ?? [],
    cloud_devops: analysis.cloud_devops ?? [],
    other: Array.isArray(analysis.skills) ? analysis.skills : [],
  };
}

function SkillCategories({ analysis }: { analysis: ResumeAnalysis }) {
  const categories = categorizedSkills(analysis);
  const entries = [
    ["Programming languages", categories.programming_languages ?? []],
    ["ML / AI", categories.ml_ai ?? []],
    ["Frameworks & libraries", categories.frameworks_libraries ?? []],
    ["Tools & platforms", categories.tools_platforms ?? []],
    ["Databases", categories.databases ?? []],
    ["Cloud / DevOps", categories.cloud_devops ?? []],
    ["Other", categories.other ?? []],
  ].filter(([, values]) => Array.isArray(values) && values.length > 0) as [
    string,
    string[],
  ][];

  if (entries.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {entries.map(([label, values]) => (
        <div key={label}>
          <p className="text-sm font-medium text-neutral-700">{label}</p>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            {uniqueValues(values).join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProjectValue({ values }: { values: ResumeAnalysis["projects"] }) {
  if (!Array.isArray(values) || values.length === 0) {
    return <EmptyState />;
  }
  if (!values.every(isProject)) {
    return (
      <ListValue
        values={values.filter((value): value is string => typeof value === "string")}
      />
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {values.map((project) => (
        <article
          key={project.name}
          className="rounded-md border border-neutral-200 p-4"
        >
          <p className="text-sm font-semibold text-neutral-950">
            {project.name}
          </p>
          {project.description.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-700">
              {project.description.map((description) => (
                <li key={description}>{description}</li>
              ))}
            </ul>
          ) : null}
          {project.technologies.length > 0 ? (
            <p className="mt-3 text-sm text-neutral-500">
              Technologies: {project.technologies.join(", ")}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ExperienceValue({ values }: { values: ResumeAnalysis["experience"] }) {
  if (!Array.isArray(values) || values.length === 0) {
    return <EmptyState />;
  }
  if (!values.every(isExperience)) {
    return (
      <ListValue
        values={values.filter((value): value is string => typeof value === "string")}
      />
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {values.map((experience) => (
        <article
          key={`${experience.organization}-${experience.role}`}
          className="rounded-md border border-neutral-200 p-4"
        >
          <p className="text-sm font-semibold text-neutral-950">
            {[experience.role, experience.organization].filter(Boolean).join(" - ") ||
              experience.organization ||
              "Experience"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {experience.experience_type.replace("_", " ")}
            {experience.start_date ? ` | ${experience.start_date}` : ""}
            {experience.end_date ? ` - ${experience.end_date}` : ""}
          </p>
          {experience.description.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-700">
              {experience.description.map((description) => (
                <li key={description}>{description}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
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
            <SkillCategories analysis={analysis} />
          </Section>
          <Section title="Summary">
            <TextValue value={analysis.summary} />
          </Section>
          <Section title="Education">
            <ListValue values={analysis.education} />
          </Section>
          <Section title="Experience">
            <ExperienceValue values={analysis.experience} />
          </Section>
          <Section title="Projects">
            <ProjectValue values={analysis.projects} />
          </Section>
          <Section title="Certifications">
            <ListValue values={analysis.certifications} />
          </Section>
        </div>
      ) : null}
    </div>
  );
}
