export type HealthResponse = {
  status: "ok";
  service: "hiremind-api";
};

export type BackendHealthStatus =
  | {
      connected: true;
      data: HealthResponse;
    }
  | {
      connected: false;
    };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type Resume = {
  id: string;
  original_filename: string;
  file_type: string;
  extracted_text: string | null;
};

export type ResumeListResponse = {
  resumes: Resume[];
};

export async function getBackendHealth(): Promise<BackendHealthStatus> {
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { connected: false };
    }

    const data = (await response.json()) as Partial<HealthResponse>;

    if (data.status !== "ok" || data.service !== "hiremind-api") {
      return { connected: false };
    }

    return {
      connected: true,
      data: {
        status: data.status,
        service: data.service,
      },
    };
  } catch {
    return { connected: false };
  }
}

export async function getResumes(token?: string): Promise<Resume[]> {
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${apiUrl}/api/resumes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Partial<ResumeListResponse>;
    return Array.isArray(data.resumes) ? data.resumes : [];
  } catch {
    return [];
  }
}
