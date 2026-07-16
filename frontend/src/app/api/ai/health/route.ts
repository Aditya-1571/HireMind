import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const response = await fetch(`${apiUrl}/api/ai/health`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        ollama_reachable: false,
        model: "unknown",
        model_available: false,
      },
      { status: 503 },
    );
  }
}
