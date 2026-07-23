import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import { getBackendApiUrl } from "@/lib/serverConfig";

const apiUrl = getBackendApiUrl();

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

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${apiUrl}/api/resumes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Unable to load resumes") },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { message: "Resume service unavailable" },
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
    const formData = await request.formData();
    const response = await fetch(`${apiUrl}/api/resumes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Resume upload failed") },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json(), { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Resume upload unavailable" },
      { status: 503 },
    );
  }
}
