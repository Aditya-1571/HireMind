"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompletedInterview, Interview } from "@/lib/api";
import { Alert, Badge, Button, Card, fieldClassName } from "@/components/ui";

type InterviewSessionProps = {
  initialInterview: Interview;
};

export function InterviewSession({ initialInterview }: InterviewSessionProps) {
  const router = useRouter();
  const [interview, setInterview] = useState(initialInterview);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!interview.time_limit_minutes || !interview.started_at) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [interview.started_at, interview.time_limit_minutes]);

  const currentQuestion = useMemo(
    () =>
      interview.questions
        .slice()
        .sort((first, second) => first.sequence_number - second.sequence_number)
        .find((question) => !question.user_answer),
    [interview.questions],
  );

  const progressNumber = currentQuestion
    ? currentQuestion.sequence_number
    : interview.total_questions;
  const isComplete = interview.status === "completed" || !currentQuestion;
  const progressPercent =
    interview.total_questions > 0
      ? Math.round((interview.answered_count / interview.total_questions) * 100)
      : 0;
  const startedAtMs = interview.started_at
    ? new Date(interview.started_at).getTime()
    : Number.NaN;
  const hasTimedInterview =
    Boolean(interview.time_limit_minutes) && Number.isFinite(startedAtMs);
  const remainingSeconds = hasTimedInterview
    ? Math.max(
        0,
        Math.ceil(
          (startedAtMs +
            Number(interview.time_limit_minutes) * 60 * 1000 -
            now) /
            1000,
        ),
      )
    : null;
  const timerTone =
    remainingSeconds === null
      ? "neutral"
      : remainingSeconds <= 0
        ? "expired"
        : remainingSeconds <= 60
          ? "urgent"
          : remainingSeconds <= 300
            ? "warning"
            : "neutral";

  const formatRemainingTime = (seconds: number | null) => {
    if (seconds === null) {
      return "Unlimited";
    }
    const minutes = Math.floor(seconds / 60);
    const leftoverSeconds = seconds % 60;
    return `${minutes}:${String(leftoverSeconds).padStart(2, "0")}`;
  };

  const formatEvaluationStyle = (style: string) =>
    style
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const completeInterview = async () => {
    if (isCompleting) {
      return;
    }

    setIsCompleting(true);
    setMessage(null);
    const response = await fetch(`/api/interviews/${interview.id}/complete`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as {
        message?: unknown;
      };
      setMessage(
        typeof error.message === "string"
          ? error.message
          : "Unable to complete interview.",
      );
      setIsCompleting(false);
      return;
    }

    const completedInterview = (await response.json()) as CompletedInterview;
    router.push(
      `/interviews/${interview.id}/complete?source=${completedInterview.evaluation_source}`,
    );
    router.refresh();
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/interviews/${interview.id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          message?: unknown;
        };
        setMessage(
          typeof error.message === "string"
            ? error.message
            : "Unable to submit answer.",
        );
        setIsSubmitting(false);
        return;
      }

      const updatedInterview = (await response.json()) as Interview;
      setInterview(updatedInterview);
      setAnswer("");

      if (updatedInterview.answered_count >= updatedInterview.total_questions) {
        await completeInterview();
      }
    } catch {
      setMessage("Interview service is unavailable.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
            {interview.interview_type} interview
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
            {interview.difficulty} difficulty
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Target role: {interview.target_role}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Badge>
              {formatEvaluationStyle(interview.evaluation_style)}
            </Badge>
            <Badge>
              {interview.answer_mode === "text" ? "Text Answer" : "Text"}
            </Badge>
            <Badge tone={interview.time_limit_minutes ? "warning" : "neutral"}>
              {interview.time_limit_minutes
                ? `${interview.time_limit_minutes} min limit`
                : "Unlimited"}
            </Badge>
          </div>
        </div>
        <div className="space-y-2 sm:text-right">
          <p className="rounded-xl border border-slate-200/70 bg-blue-50/70 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700/60 dark:bg-slate-950/35 dark:text-slate-200">
            Question {progressNumber} of {interview.total_questions}
          </p>
          <p
            className={
              timerTone === "expired"
                ? "text-sm font-semibold text-red-700"
                : timerTone === "urgent"
                  ? "text-sm font-semibold text-red-600"
                  : timerTone === "warning"
                    ? "text-sm font-semibold text-amber-700"
                    : "text-sm font-medium text-slate-600 dark:text-slate-300"
            }
          >
            {timerTone === "expired"
              ? "Time is up"
              : `Remaining: ${formatRemainingTime(remainingSeconds)}`}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-fuchsia-500 transition-all"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {interview.answered_count} answered. The timer is advisory in this
          version, so your saved answers will not be lost when time reaches
          zero.
        </p>
      </div>

      {currentQuestion ? (
        <div className="mt-8 rounded-2xl border border-slate-200/75 bg-blue-50/45 p-5 dark:border-slate-700/55 dark:bg-slate-950/30">
          <p className="text-lg font-medium leading-7 text-slate-950 dark:text-slate-50">
            {currentQuestion.question_text}
          </p>
          <label
            htmlFor="answer"
            className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Your answer
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={isSubmitting || isCompleting}
            rows={8}
            className={`mt-2 min-h-48 ${fieldClassName}`}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={submitAnswer}
              disabled={isSubmitting || isCompleting || !answer.trim()}
            >
              {isSubmitting ? "Submitting..." : "Submit answer"}
            </Button>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {interview.answered_count} answered
            </p>
          </div>
        </div>
      ) : null}

      {isComplete ? (
        <div className="mt-8 rounded-2xl border border-slate-200/75 bg-blue-50/45 p-4 dark:border-slate-700/55 dark:bg-slate-950/30">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {isCompleting
              ? "Evaluating your interview responses..."
              : "All questions have been answered."}
          </p>
          <Button className="mt-4" onClick={completeInterview} disabled={isCompleting}>
            {isCompleting ? "Evaluating..." : "View report"}
          </Button>
        </div>
      ) : null}

      {message ? (
        <Alert className="mt-4" tone="danger">
          {message}
        </Alert>
      ) : null}
    </Card>
  );
}
