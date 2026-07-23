import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import {
  forwardJsonResponse,
  getErrorMessage,
  readRequestJson,
  type ErrorResponse,
} from "@/lib/routeErrors";
import { getBackendApiUrl } from "@/lib/serverConfig";

const apiUrl = getBackendApiUrl();

type RouteContext = {
  params: Promise<{ interviewId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { interviewId } = await context.params;

  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const response = await fetch(
      `${apiUrl}/api/interviews/${interviewId}/answers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.body),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Unable to submit answer") },
        { status: response.status },
      );
    }

    return forwardJsonResponse(response);
  } catch {
    return NextResponse.json(
      { message: "Interview service unavailable" },
      { status: 503 },
    );
  }
}
