"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompletedInterview, Interview } from "@/lib/api";

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
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            {interview.interview_type} interview
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">
            {interview.difficulty} difficulty
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Target role: {interview.target_role}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-neutral-600">
            <span className="rounded-md bg-neutral-100 px-2 py-1">
              {formatEvaluationStyle(interview.evaluation_style)}
            </span>
            <span className="rounded-md bg-neutral-100 px-2 py-1">
              {interview.answer_mode === "text" ? "Text Answer" : "Text"}
            </span>
            <span className="rounded-md bg-neutral-100 px-2 py-1">
              {interview.time_limit_minutes
                ? `${interview.time_limit_minutes} min limit`
                : "Unlimited"}
            </span>
          </div>
        </div>
        <div className="space-y-2 sm:text-right">
          <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700">
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
                    : "text-sm font-medium text-neutral-600"
            }
          >
            {timerTone === "expired"
              ? "Time is up"
              : `Remaining: ${formatRemainingTime(remainingSeconds)}`}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-950"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          {interview.answered_count} answered. The timer is advisory in this
          version, so your saved answers will not be lost when time reaches
          zero.
        </p>
      </div>

      {currentQuestion ? (
        <div className="mt-8">
          <p className="text-lg font-medium leading-7 text-neutral-950">
            {currentQuestion.question_text}
          </p>
          <label
            htmlFor="answer"
            className="mt-6 block text-sm font-medium text-neutral-700"
          >
            Your answer
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={isSubmitting || isCompleting}
            rows={8}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submitAnswer}
              disabled={isSubmitting || isCompleting || !answer.trim()}
              className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <p className="text-sm text-neutral-500">
              {interview.answered_count} answered
            </p>
          </div>
        </div>
      ) : null}

      {isComplete ? (
        <div className="mt-8 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-700">
            {isCompleting
              ? "Evaluating your interview responses..."
              : "All questions have been answered."}
          </p>
          <button
            type="button"
            onClick={completeInterview}
            disabled={isCompleting}
            className="mt-4 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {isCompleting ? "Evaluating..." : "View Summary"}
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
    </section>
  );
}
