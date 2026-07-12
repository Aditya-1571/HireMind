"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const interviewTypes = ["HR", "Technical", "Mixed"];
const difficultyLevels = ["Easy", "Medium", "Hard"];

export function StartInterviewForm() {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState("HR");
  const [difficulty, setDifficulty] = useState("Easy");
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleStart = async () => {
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
      </div>
      <button
        type="button"
        onClick={handleStart}
        disabled={isStarting}
        className="mt-6 rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {isStarting ? "Starting..." : "Start Interview"}
      </button>
      {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
    </section>
  );
}
