export type SafeErrorPayload = {
  message?: unknown;
  detail?: unknown;
};

const statusMessages: Record<number, string> = {
  400: "The request could not be processed. Check the highlighted fields and try again.",
  401: "Your session has expired. Sign in again to continue.",
  403: "You do not have permission to access this resource.",
  404: "We could not find the requested item.",
  408: "The request timed out. Try again in a moment.",
  429: "Too many requests. Wait a moment, then try again.",
  500: "The service ran into a problem. Try again shortly.",
  502: "The service is temporarily unavailable.",
  503: "The service is temporarily unavailable.",
  504: "The request took too long. Try again shortly.",
};

export function messageFromStatus(status: number, fallback: string) {
  return statusMessages[status] ?? fallback;
}

export function messageFromPayload(
  payload: SafeErrorPayload,
  fallback: string,
) {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }
  return fallback;
}

export async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text().catch(() => "");
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function responseErrorMessage(
  response: Response,
  fallback: string,
) {
  const payload = await readJsonSafely<SafeErrorPayload>(response);
  return messageFromPayload(
    payload ?? {},
    messageFromStatus(response.status, fallback),
  );
}

export function networkErrorMessage(fallback = "Network connection failed.") {
  return fallback;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 30000,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}
