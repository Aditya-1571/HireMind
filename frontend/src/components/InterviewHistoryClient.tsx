"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { InterviewListResponse } from "@/lib/api";
import { Badge, Button, Card, EmptyState, fieldClassName } from "@/components/ui";
import {
  fetchWithTimeout,
  readJsonSafely,
  responseErrorMessage,
} from "@/lib/errors";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const typeOptions = [
  { value: "", label: "All types" },
  { value: "HR", label: "HR" },
  { value: "Technical", label: "Technical" },
  { value: "Mixed", label: "Mixed" },
];

const difficultyOptions = [
  { value: "", label: "All difficulties" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest_score", label: "Highest score" },
  { value: "lowest_score", label: "Lowest score" },
];

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return dateTimeFormatter.format(new Date(value));
}

function emptyResponse(): InterviewListResponse {
  return {
    interviews: [],
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  };
}

function statusTone(status: string) {
  return status === "completed" ? "success" : "info";
}

export function InterviewHistoryClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<InterviewListResponse>(emptyResponse);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState(
    searchParams.get("target_role") ?? "",
  );

  const queryString = searchParams.toString();
  const hasFilters = useMemo(
    () =>
      Boolean(
        searchParams.get("status") ||
          searchParams.get("interview_type") ||
          searchParams.get("difficulty") ||
          searchParams.get("target_role"),
      ),
    [searchParams],
  );

  useEffect(() => {
    let ignore = false;

    fetchWithTimeout(`/api/interviews${queryString ? `?${queryString}` : ""}`, {
      cache: "no-store",
    }, 30000)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await responseErrorMessage(response, "Unable to load interview history."),
          );
        }
        const payload = await readJsonSafely<InterviewListResponse>(response);
        if (!payload || !Array.isArray(payload.interviews)) {
          throw new Error("Interview history returned an invalid response.");
        }
        return payload;
      })
      .then((payload) => {
        if (!ignore) {
          setData(payload);
        }
      })
      .catch((fetchError: unknown) => {
        if (!ignore) {
          setData(emptyResponse());
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load interview history.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [queryString]);

  useEffect(() => {
    const currentValue = searchParams.get("target_role") ?? "";
    if (targetRole === currentValue) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      const cleaned = targetRole.trim();
      if (cleaned) {
        next.set("target_role", cleaned);
      } else {
        next.delete("target_role");
      }
      next.set("page", "1");
      setIsLoading(true);
      setError(null);
      router.push(`${pathname}?${next.toString()}`);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, targetRole]);

  const updateParam = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (resetPage) {
      next.set("page", "1");
    }
    setIsLoading(true);
    setError(null);
    router.push(`${pathname}?${next.toString()}`);
  };

  const currentPage = data.page || Number(searchParams.get("page") ?? "1");
  const canGoPrevious = currentPage > 1;
  const canGoNext = data.total_pages > 0 && currentPage < data.total_pages;

  return (
    <Card className="mt-6 p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label
            htmlFor="status"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Status
          </label>
          <select
            id="status"
            value={searchParams.get("status") ?? ""}
            onChange={(event) => updateParam("status", event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="interview_type"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Type
          </label>
          <select
            id="interview_type"
            value={searchParams.get("interview_type") ?? ""}
            onChange={(event) =>
              updateParam("interview_type", event.target.value)
            }
            className={`mt-2 ${fieldClassName}`}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="difficulty"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Difficulty
          </label>
          <select
            id="difficulty"
            value={searchParams.get("difficulty") ?? ""}
            onChange={(event) => updateParam("difficulty", event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Sort
          </label>
          <select
            id="sort"
            value={searchParams.get("sort") ?? "newest"}
            onChange={(event) => updateParam("sort", event.target.value)}
            className={`mt-2 ${fieldClassName}`}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="target_role"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Target role
          </label>
          <input
            id="target_role"
            type="search"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="Search role"
            className={`mt-2 ${fieldClassName}`}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/70" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/70" />
        </div>
      ) : null}

      {error ? <p className="mt-6 text-sm text-red-600 dark:text-red-300">{error}</p> : null}

      {!isLoading && !error && data.interviews.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={hasFilters ? "No matching interviews" : "No interviews yet"}
          description={
            hasFilters
              ? "Try changing the filters or search text."
              : "Completed and in-progress interviews will appear here."
          }
        />
      ) : null}

      {!isLoading && !error && data.interviews.length > 0 ? (
        <>
          <div className="mt-6 divide-y divide-slate-200/70 dark:divide-slate-800">
            {data.interviews.map((interview) => (
              <article
                key={interview.id}
                className="rounded-2xl px-3 py-5 transition-colors hover:bg-blue-50/55 dark:hover:bg-slate-800/45 lg:flex lg:items-center lg:justify-between lg:gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">
                      {interview.target_role}
                    </h2>
                    <Badge tone={statusTone(interview.status)}>
                      {interview.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {interview.interview_type} - {interview.difficulty}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Resume: {interview.resume_filename ?? "Not selected"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {interview.answered_count} of {interview.total_questions} answered -{" "}
                    {interview.question_count} questions requested
                  </p>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[420px]">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Score</dt>
                    <dd className="mt-1 font-medium text-slate-950 dark:text-slate-50">
                      {interview.overall_score === null
                        ? "N/A"
                        : `${interview.overall_score}/100`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                    <dd className="mt-1 font-medium text-slate-950 dark:text-slate-50">
                      {formatDate(interview.started_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Completed</dt>
                    <dd className="mt-1 font-medium text-slate-950 dark:text-slate-50">
                      {formatDate(interview.completed_at)}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={
                    interview.status === "completed"
                      ? `/interviews/${interview.id}/complete`
                      : `/interviews/${interview.id}`
                  }
                  className="mt-4 inline-flex w-fit rounded-xl bg-gradient-to-r from-blue-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-fuchsia-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950 lg:mt-0"
                >
                  {interview.status === "completed"
                    ? "View Report"
                    : "Continue Interview"}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {currentPage} of {data.total_pages || 1} - {data.total}{" "}
              total
            </p>
            <div className="flex gap-2">
              <Button
                disabled={!canGoPrevious}
                onClick={() => updateParam("page", String(currentPage - 1), false)}
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                disabled={!canGoNext}
                onClick={() => updateParam("page", String(currentPage + 1), false)}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
}
