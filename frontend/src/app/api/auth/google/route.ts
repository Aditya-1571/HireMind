import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";
import { readRequestJson } from "@/lib/routeErrors";
import { getBackendApiUrl } from "@/lib/serverConfig";

const apiUrl = getBackendApiUrl();

type LoginResponse = {
  session_token: string;
  user: unknown;
};

type ErrorResponse = {
  detail?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.body as { credential?: unknown };

    if (typeof body.credential !== "string") {
      return NextResponse.json({ message: "Missing credential" }, { status: 400 });
    }

    const response = await fetch(`${apiUrl}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential: body.credential }),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ErrorResponse;
      const message =
        typeof error.detail === "string"
          ? error.detail
          : typeof error.message === "string"
            ? error.message
            : "Google sign-in failed";

      return NextResponse.json(
        { message },
        { status: response.status },
      );
    }

    const data = (await response.json()) as LoginResponse;

    if (typeof data.session_token !== "string") {
      return NextResponse.json(
        { message: "Invalid authentication response" },
        { status: 502 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(sessionCookieName, data.session_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json(
      { message: "Google sign-in unavailable" },
      { status: 503 },
    );
  }
}
