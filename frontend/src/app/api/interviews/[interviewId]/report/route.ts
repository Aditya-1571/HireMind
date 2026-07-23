import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import { getBackendApiUrl } from "@/lib/serverConfig";

const apiUrl = getBackendApiUrl();

type RouteContext = {
  params: Promise<{ interviewId: string }>;
};

type ErrorResponse = {
  detail?: unknown;
  message?: unknown;
};

function getErrorMessage(error: ErrorResponse, fallback: string) {
  return typeof error.detail === "string"
    ? error.detail
    : typeof error.message === "string"
      ? error.message
      : fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { interviewId } = await context.params;

  try {
    const response = await fetch(
      `${apiUrl}/api/interviews/${interviewId}/report`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Unable to load interview report") },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { message: "Interview report service unavailable" },
      { status: 503 },
    );
  }
}
