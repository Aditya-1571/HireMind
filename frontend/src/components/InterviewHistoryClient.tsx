"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { InterviewListResponse } from "@/lib/api";

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

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

    fetch(`/api/interviews${queryString ? `?${queryString}` : ""}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            message?: unknown;
          };
          throw new Error(
            typeof payload.message === "string"
              ? payload.message
              : "Unable to load interview history.",
          );
        }
        return response.json() as Promise<InterviewListResponse>;
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
    <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label
            htmlFor="status"
            className="text-sm font-medium text-neutral-700"
          >
            Status
          </label>
          <select
            id="status"
            value={searchParams.get("status") ?? ""}
            onChange={(event) => updateParam("status", event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
            className="text-sm font-medium text-neutral-700"
          >
            Type
          </label>
          <select
            id="interview_type"
            value={searchParams.get("interview_type") ?? ""}
            onChange={(event) =>
              updateParam("interview_type", event.target.value)
            }
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
            className="text-sm font-medium text-neutral-700"
          >
            Difficulty
          </label>
          <select
            id="difficulty"
            value={searchParams.get("difficulty") ?? ""}
            onChange={(event) => updateParam("difficulty", event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="text-sm font-medium text-neutral-700">
            Sort
          </label>
          <select
            id="sort"
            value={searchParams.get("sort") ?? "newest"}
            onChange={(event) => updateParam("sort", event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
            className="text-sm font-medium text-neutral-700"
          >
            Target role
          </label>
          <input
            id="target_role"
            type="search"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="Search role"
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-neutral-600">Loading interviews...</p>
      ) : null}

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && data.interviews.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-sm font-medium text-neutral-700">
            {hasFilters ? "No matching interviews" : "No interviews yet"}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {hasFilters
              ? "Try changing the filters or search text."
              : "Completed and in-progress interviews will appear here."}
          </p>
        </div>
      ) : null}

      {!isLoading && !error && data.interviews.length > 0 ? (
        <>
          <div className="mt-6 divide-y divide-neutral-200">
            {data.interviews.map((interview) => (
              <article
                key={interview.id}
                className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    {interview.target_role}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {interview.interview_type} - {interview.difficulty}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Status: {interview.status.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Resume: {interview.resume_filename ?? "Not selected"}
                  </p>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[420px]">
                  <div>
                    <dt className="text-neutral-500">Score</dt>
                    <dd className="mt-1 font-medium text-neutral-950">
                      {interview.overall_score === null
                        ? "N/A"
                        : `${interview.overall_score}/100`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Created</dt>
                    <dd className="mt-1 font-medium text-neutral-950">
                      {formatDate(interview.started_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Completed</dt>
                    <dd className="mt-1 font-medium text-neutral-950">
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
                  className="inline-flex w-fit rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  {interview.status === "completed"
                    ? "View result"
                    : "Continue"}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Page {currentPage} of {data.total_pages || 1} - {data.total}{" "}
              total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => updateParam("page", String(currentPage - 1), false)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => updateParam("page", String(currentPage + 1), false)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
