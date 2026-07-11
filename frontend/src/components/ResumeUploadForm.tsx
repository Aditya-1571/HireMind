"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UploadState = "idle" | "uploading" | "success" | "error";

export function ResumeUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setState("error");
      setMessage("Choose a resume file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setState("uploading");
    setMessage(null);

    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          message?: unknown;
        };
        setState("error");
        setMessage(
          typeof error.message === "string"
            ? error.message
            : "Resume upload failed.",
        );
        return;
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setState("success");
      setMessage("Resume uploaded successfully.");
      router.refresh();
    } catch {
      setState("error");
      setMessage("Resume upload is unavailable.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="resume"
          className="block text-sm font-medium text-neutral-700"
        >
          Resume file
        </label>
        <input
          ref={inputRef}
          id="resume"
          name="file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 file:mr-4 file:rounded-md file:border-0 file:bg-neutral-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state === "uploading"}
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {state === "uploading" ? "Uploading..." : "Upload resume"}
        </button>
        <p className="text-sm text-neutral-500">PDF, DOCX, or TXT up to 5 MB.</p>
      </div>
      {message ? (
        <p
          className={
            state === "error" ? "text-sm text-red-600" : "text-sm text-green-700"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
