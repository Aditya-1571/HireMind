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

export async function GET(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const search = new URL(request.url).search;

  try {
    const response = await fetch(`${apiUrl}/api/interviews${search}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Unable to load interviews") },
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

export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const response = await fetch(`${apiUrl}/api/interviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.body),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Unable to start interview") },
        { status: response.status },
      );
    }

    return forwardJsonResponse(response, 201);
  } catch {
    return NextResponse.json(
      { message: "Interview service unavailable" },
      { status: 503 },
    );
  }
}
