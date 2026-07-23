"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreatedInterview, InterviewDefaults, Resume } from "@/lib/api";
import { Alert, Badge, Button, Card, fieldClassName } from "@/components/ui";

const interviewTypes = ["HR", "Technical", "Mixed"];
const difficultyLevels = ["Easy", "Medium", "Hard"];
const questionCountPresets = [5, 10, 15, 20];
const targetRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Custom Role",
];
const timeLimitOptions = [
  { label: "Unlimited", value: "" },
  { label: "15 minutes", value: "15" },
  { label: "30 minutes", value: "30" },
  { label: "45 minutes", value: "45" },
  { label: "60 minutes", value: "60" },
];
const evaluationStyles = [
  { label: "Beginner friendly", value: "beginner_friendly" },
  { label: "Balanced", value: "balanced" },
  { label: "Strict", value: "strict" },
];

type StartInterviewFormProps = {
  resumes: Resume[];
  initialValues?: {
    role?: string;
    difficulty?: string;
    interviewType?: string;
    questionCount?: string;
    timeLimitMinutes?: string;
    evaluationStyle?: string;
    answerMode?: string;
  };
  savedDefaults?: InterviewDefaults | null;
  savedTargetRole?: string | null;
  hasSavedDefaults?: boolean;
};

function validInterviewType(value?: string | null) {
  return value && interviewTypes.includes(value) ? value : null;
}

function validDifficulty(value?: string | null) {
  return value && difficultyLevels.includes(value) ? value : null;
}

function validEvaluationStyle(value?: string | null) {
  return value && evaluationStyles.some((item) => item.value === value)
    ? value
    : null;
}

function validTimeLimit(value?: string | number | null) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return timeLimitOptions.some((item) => item.value === normalized)
    ? normalized
    : null;
}

function getInitialQuestionMode(value?: string | number | null) {
  return questionCountPresets.includes(Number(value)) ? String(value) : "10";
}

function getInitialCustomQuestionCount(value?: string | number | null) {
  const count = Number(value);
  if (
    value !== undefined &&
    value !== null &&
    String(value) &&
    Number.isInteger(count) &&
    count >= 5 &&
    count <= 30 &&
    !questionCountPresets.includes(count)
  ) {
    return String(value);
  }
  return "";
}

export function StartInterviewForm({
  resumes,
  initialValues,
  savedDefaults,
  savedTargetRole,
  hasSavedDefaults,
}: StartInterviewFormProps) {
  const router = useRouter();
  const defaultRole = initialValues?.role ?? savedTargetRole ?? "Software Engineer";
  const isInitialCustomRole =
    Boolean(defaultRole) && !targetRoles.includes(defaultRole);
  const initialQuestionCount =
    initialValues?.questionCount ?? savedDefaults?.question_count ?? 10;
  const [interviewType, setInterviewType] = useState(
    validInterviewType(initialValues?.interviewType) ??
      validInterviewType(savedDefaults?.interview_type) ??
      "HR",
  );
  const [difficulty, setDifficulty] = useState(
    validDifficulty(initialValues?.difficulty) ??
      validDifficulty(savedDefaults?.difficulty) ??
      "Easy",
  );
  const [targetRole, setTargetRole] = useState(
    isInitialCustomRole ? "Custom Role" : defaultRole,
  );
  const [customRole, setCustomRole] = useState(
    isInitialCustomRole ? defaultRole : "",
  );
  const [questionCountMode, setQuestionCountMode] = useState(
    getInitialCustomQuestionCount(initialQuestionCount)
      ? "custom"
      : getInitialQuestionMode(initialQuestionCount),
  );
  const [customQuestionCount, setCustomQuestionCount] = useState(
    getInitialCustomQuestionCount(initialQuestionCount),
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    validTimeLimit(initialValues?.timeLimitMinutes) ??
      validTimeLimit(savedDefaults?.time_limit_minutes) ??
      "",
  );
  const [evaluationStyle, setEvaluationStyle] = useState(
    validEvaluationStyle(initialValues?.evaluationStyle) ??
      validEvaluationStyle(savedDefaults?.evaluation_style) ??
      "balanced",
  );
  const [resumeId, setResumeId] = useState(
    resumes.length === 1 ? resumes[0].id : "",
  );
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const trimmedCustomRole = customRole.trim();
  const isCustomRole = targetRole === "Custom Role";
  const isTargetRoleValid =
    Boolean(interviewType) &&
    Boolean(difficulty) &&
    (!isCustomRole ||
      (trimmedCustomRole.length >= 2 && trimmedCustomRole.length <= 100));
  const questionCount =
    questionCountMode === "custom"
      ? Number(customQuestionCount)
      : Number(questionCountMode);
  const customHasOnlyDigits = /^[0-9]+$/.test(customQuestionCount);
  const isQuestionCountValid =
    Number.isInteger(questionCount) && questionCount >= 5 && questionCount <= 30;
  const questionCountError =
    questionCountMode !== "custom"
      ? null
      : !customQuestionCount
        ? "Enter a custom question count."
        : !customHasOnlyDigits
          ? "Question count must be a whole number."
          : !isQuestionCountValid
            ? "Choose between 5 and 30 questions."
            : null;
  const canStart = isTargetRoleValid && isQuestionCountValid && !isStarting;
  const defaultSource = initialValues?.role || initialValues?.difficulty || initialValues?.questionCount
    ? "Practice Again values applied"
    : hasSavedDefaults
      ? "Saved defaults applied"
      : "Application defaults applied";

  const handleStart = async () => {
    if (!canStart) {
      return;
    }

    setIsStarting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interview_type: interviewType,
          difficulty,
          target_role: targetRole,
          custom_role: isCustomRole ? trimmedCustomRole : undefined,
          resume_id: resumeId || undefined,
          question_count: questionCount,
          time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
          evaluation_style: evaluationStyle,
          answer_mode: "text",
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          message?: unknown;
        };
        setMessage(
          typeof error.message === "string"
            ? error.message
            : "Unable to start interview.",
        );
        setIsStarting(false);
        return;
      }

      const interview = (await response.json()) as CreatedInterview;
      router.push(`/interviews/${interview.id}`);
      router.refresh();
    } catch {
      setMessage("Interview service is unavailable.");
      setIsStarting(false);
    }
  };

  return (
    <Card className="mt-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
            Interview configuration
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Review the setup before generating questions. You can change these
            values for this interview without changing saved settings.
          </p>
        </div>
        <Badge tone={defaultSource.startsWith("Practice") ? "info" : "neutral"}>
          {defaultSource}
        </Badge>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Interview type
          </label>
          <select
            value={interviewType}
            onChange={(event) => setInterviewType(event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {interviewTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {difficultyLevels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Target role
          </label>
          <select
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {targetRoles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {isCustomRole ? (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Custom role
            </label>
            <input
              value={customRole}
              onChange={(event) => setCustomRole(event.target.value)}
              maxLength={100}
              className={`mt-2 ${fieldClassName}`}
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Enter 2 to 100 characters.
            </p>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Number of questions
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {questionCountPresets.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => {
                  setQuestionCountMode(String(count));
                  setCustomQuestionCount("");
                }}
                className={
                  questionCountMode === String(count)
                    ? "rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white"
                    : "rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700/70 dark:bg-slate-950/25 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:bg-slate-800/75"
                }
              >
                {count}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setQuestionCountMode("custom")}
              className={
                questionCountMode === "custom"
                  ? "rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700/70 dark:bg-slate-950/25 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:bg-slate-800/75"
              }
            >
              Custom
            </button>
          </div>
          {questionCountMode === "custom" ? (
            <input
              value={customQuestionCount}
              onChange={(event) => setCustomQuestionCount(event.target.value)}
              inputMode="numeric"
              placeholder="Enter 5 to 30"
              className={`mt-3 ${fieldClassName}`}
            />
          ) : null}
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Choose between 5 and 30 questions. Longer interviews take more time
            to generate and evaluate.
          </p>
          {questionCountError ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">{questionCountError}</p>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Time limit
          </label>
          <select
            value={timeLimitMinutes}
            onChange={(event) => setTimeLimitMinutes(event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {timeLimitOptions.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Evaluation style
          </label>
          <select
            value={evaluationStyle}
            onChange={(event) => setEvaluationStyle(event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {evaluationStyles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Answer mode</p>
          <p className="mt-2 rounded-xl border border-slate-200/70 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-950/35 dark:text-slate-300">
            Text Answer
          </p>
        </div>
        {resumes.length > 0 ? (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Resume context
            </label>
            <select
              value={resumeId}
              onChange={(event) => setResumeId(event.target.value)}
              className={`mt-2 ${fieldClassName}`}
            >
              <option value="">No resume</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.original_filename}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <Button className="mt-6" onClick={handleStart} disabled={!canStart}>
        {isStarting ? "Generating..." : "Start Interview"}
      </Button>
      {isStarting ? (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Generating personalized interview questions...
        </p>
      ) : null}
      {message ? (
        <Alert className="mt-4" tone="danger">
          {message}
        </Alert>
      ) : null}
    </Card>
  );
}
