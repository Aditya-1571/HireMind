"use client";

import { useState } from "react";
import type { AiGeneration, AiHealth } from "@/lib/api";
import { Alert, Badge, Button, Card } from "@/components/ui";

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
  const statusTone = !health.ollama_reachable
    ? "danger"
    : !health.model_available
      ? "warning"
      : "success";

  return (
    <Card className="mt-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">AI Status</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone}>{getStatusLabel(health)}</Badge>
            <span className="text-sm text-slate-600 dark:text-slate-300">{health.model}</span>
          </div>
        </div>
        <Button
          onClick={testAi}
          disabled={isTesting || !health.ollama_reachable || !health.model_available}
        >
          {isTesting ? "Testing..." : "Test AI"}
        </Button>
      </div>
      {result ? (
        <div className="mt-4 rounded-2xl border border-slate-200/75 bg-blue-50/45 p-4 dark:border-slate-700/60 dark:bg-slate-950/30">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{result.model}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {result.generated_text}
          </p>
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
