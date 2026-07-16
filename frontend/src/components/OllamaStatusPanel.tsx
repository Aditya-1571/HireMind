"use client";

import { useState } from "react";
import type { AiGeneration, AiHealth } from "@/lib/api";

type OllamaStatusPanelProps = {
  health: AiHealth;
};

function getStatusLabel(health: AiHealth) {
  if (!health.ollama_reachable) {
    return "Ollama unavailable";
  }
  if (!health.model_available) {
    return "Model not installed";
  }
  return "Connected";
}

export function OllamaStatusPanel({ health }: OllamaStatusPanelProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<AiGeneration | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const testAi = async () => {
    setIsTesting(true);
    setResult(null);
    setMessage(null);

    try {
      const response = await fetch("/api/ai/test-generation", {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          message?: unknown;
        };
        setMessage(
          typeof error.message === "string"
            ? error.message
            : "AI test unavailable.",
        );
        return;
      }

      setResult((await response.json()) as AiGeneration);
    } catch {
      setMessage("AI test unavailable.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">AI Status</h2>
          <p className="mt-2 text-sm text-neutral-600">
            {getStatusLabel(health)} - {health.model}
          </p>
        </div>
        <button
          type="button"
          onClick={testAi}
          disabled={isTesting || !health.ollama_reachable || !health.model_available}
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {isTesting ? "Testing..." : "Test AI"}
        </button>
      </div>
      {result ? (
        <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-700">{result.model}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {result.generated_text}
          </p>
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
    </section>
  );
}
