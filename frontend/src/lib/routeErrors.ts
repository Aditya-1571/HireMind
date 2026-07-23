import { NextResponse } from "next/server";

export type ErrorResponse = {
  detail?: unknown;
  message?: unknown;
};

export function getErrorMessage(error: ErrorResponse, fallback: string) {
  return typeof error.detail === "string"
    ? error.detail
    : typeof error.message === "string"
      ? error.message
      : fallback;
}

export async function readRequestJson(request: Request) {
  try {
    return { ok: true as const, body: await request.json() };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 },
      ),
    };
  }
}

export async function forwardJsonResponse(response: Response, status = response.status) {
  try {
    return NextResponse.json(await response.json(), { status });
  } catch {
    return NextResponse.json(
      { message: "Service returned an invalid response" },
      { status: 502 },
    );
  }
}
