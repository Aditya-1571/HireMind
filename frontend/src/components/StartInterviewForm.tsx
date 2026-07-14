"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const interviewTypes = ["HR", "Technical", "Mixed"];
const difficultyLevels = ["Easy", "Medium", "Hard"];
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

export function StartInterviewForm() {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState("HR");
  const [difficulty, setDifficulty] = useState("Easy");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const trimmedCustomRole = customRole.trim();
  const isCustomRole = targetRole === "Custom Role";
  const isTargetRoleValid =
    Boolean(interviewType) &&
    Boolean(difficulty) &&
    (!isCustomRole ||
      (trimmedCustomRole.length >= 2 && trimmedCustomRole.length <= 100));

  const handleStart = async () => {
    if (!isTargetRoleValid) {
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

      const interview = (await response.json()) as { id: string };
      router.push(`/interviews/${interview.id}`);
      router.refresh();
    } catch {
      setMessage("Interview service is unavailable.");
      setIsStarting(false);
    }
  };

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-neutral-950">
        Start Interview
      </h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Interview type
          </label>
          <select
            value={interviewType}
            onChange={(event) => setInterviewType(event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            {interviewTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            {difficultyLevels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700">
            Target role
          </label>
          <select
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
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
            <label className="block text-sm font-medium text-neutral-700">
              Custom role
            </label>
            <input
              value={customRole}
              onChange={(event) => setCustomRole(event.target.value)}
              maxLength={100}
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            />
            <p className="mt-2 text-sm text-neutral-500">
              Enter 2 to 100 characters.
            </p>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleStart}
        disabled={isStarting || !isTargetRoleValid}
        className="mt-6 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {isStarting ? "Starting..." : "Start Interview"}
      </button>
      {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
    </section>
  );
}
