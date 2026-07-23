"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, fieldClassName } from "@/components/ui";
import {
  fetchWithTimeout,
  networkErrorMessage,
  responseErrorMessage,
} from "@/lib/errors";

type UploadState = "idle" | "uploading" | "success" | "error";

const maxResumeBytes = 5 * 1024 * 1024;
const allowedExtensions = [".pdf", ".docx", ".txt"];
const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

function validateResumeFile(file: File) {
  const filename = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((extension) =>
    filename.endsWith(extension),
  );
  const hasAllowedType = !file.type || allowedTypes.includes(file.type);

  if (file.size === 0) {
    return "The selected file is empty. Upload a readable PDF, DOCX, or TXT resume.";
  }
  if (file.size > maxResumeBytes) {
    return "Resume must be 5 MB or smaller.";
  }
  if (!hasAllowedExtension || !hasAllowedType) {
    return "Upload a PDF, DOCX, or TXT resume.";
  }
  return null;
}

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

    const validationError = validateResumeFile(file);
    if (validationError) {
      setState("error");
      setMessage(validationError);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setState("uploading");
    setMessage(null);

    try {
      const response = await fetchWithTimeout("/api/resumes", {
        method: "POST",
        body: formData,
      }, 60000);

      if (!response.ok) {
        setState("error");
        setMessage(await responseErrorMessage(response, "Resume upload failed."));
        router.refresh();
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
      setMessage(networkErrorMessage("Resume upload is unavailable."));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="resume"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Resume file
        </label>
        <input
          ref={inputRef}
          id="resume"
          name="file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className={`mt-2 block file:mr-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-fuchsia-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:from-blue-500 hover:file:to-fuchsia-400 ${fieldClassName}`}
        />
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Upload a text-based PDF, DOCX, or TXT resume. Scanned image-only files
          are not parsed.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={state === "uploading"}
          loading={state === "uploading"}
        >
          {state === "uploading" ? "Uploading resume" : "Upload resume"}
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400">Maximum file size: 5 MB.</p>
      </div>
      {message ? (
        <Alert
          tone={state === "error" ? "danger" : "success"}
          className="py-3"
        >
          {message}
        </Alert>
      ) : null}
    </form>
  );
}
