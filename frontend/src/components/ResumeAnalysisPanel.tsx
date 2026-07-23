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
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState as EmptyPanel,
} from "@/components/ui";

type ResumeAnalysisPanelProps = {
  resume: Resume;
};

function EmptyState() {
  return <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Not found</p>;
}

function statusTone(status: string) {
  if (status === "ready") {
    return "success" as const;
  }
  if (status === "failed") {
    return "danger" as const;
  }
  if (status === "analyzing" || status === "processing") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function TextValue({ value }: { value: string | null }) {
  return value ? (
    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{value}</p>
  ) : (
    <EmptyState />
  );
}

function ListValue({ values }: { values: string[] }) {
  return values.length > 0 ? (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
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
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
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
          className="rounded-2xl border border-slate-200/75 bg-blue-50/35 p-4 dark:border-slate-700/60 dark:bg-slate-950/25"
        >
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            {project.name}
          </p>
          {project.description.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {project.description.map((description) => (
                <li key={description}>{description}</li>
              ))}
            </ul>
          ) : null}
          {project.technologies.length > 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
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
          className="rounded-2xl border border-slate-200/75 bg-blue-50/35 p-4 dark:border-slate-700/60 dark:bg-slate-950/25"
        >
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            {[experience.role, experience.organization].filter(Boolean).join(" - ") ||
              experience.organization ||
              "Experience"}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {experience.experience_type.replace("_", " ")}
            {experience.start_date ? ` | ${experience.start_date}` : ""}
            {experience.end_date ? ` - ${experience.end_date}` : ""}
          </p>
          {experience.description.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
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
    <div className="border-t border-slate-200/70 pt-4 dark:border-slate-800">
      <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
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
    <Card className="mt-5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Structured Resume Analysis
          </p>
          <div className="mt-2">
            <Badge tone={statusTone(resume.analysis_status)}>
              {resume.analysis_status}
            </Badge>
          </div>
        </div>
        {canAnalyze ? (
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
          </Button>
        ) : null}
      </div>

      {message ? (
        <Alert
          className="mt-3"
          tone={
            message.includes("failed") || message.includes("unavailable")
              ? "danger"
              : "success"
          }
        >
          {message}
        </Alert>
      ) : null}

      {resume.analysis_status === "failed" ? (
        <Alert className="mt-3" tone="danger">
          Resume analysis failed.
        </Alert>
      ) : null}

      {analysis ? (
        <div className="mt-5 space-y-4">
          <Section title="Contact information">
            <div className="mt-2 grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-3">
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
      ) : canAnalyze ? (
        <EmptyPanel
          className="mt-5"
          title="Analysis not generated yet"
          description="Run deterministic resume analysis to structure your skills, projects, education, and experience."
        />
      ) : null}
    </Card>
  );
}
