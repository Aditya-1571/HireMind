import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/serverConfig";

const apiUrl = getBackendApiUrl();

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
