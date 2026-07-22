import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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
    const response = await fetch(`${apiUrl}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Unable to load profile settings") },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { message: "Profile service unavailable" },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${apiUrl}/api/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      return NextResponse.json(
        { message: getErrorMessage(error, "Unable to save profile settings") },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { message: "Profile service unavailable" },
      { status: 503 },
    );
  }
}
