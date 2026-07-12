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
  processing_status: "uploaded" | "processing" | "ready" | "failed" | string;
  analysis_status: "pending" | "analyzing" | "ready" | "failed" | string;
  analysis_data: ResumeAnalysis | null;
};

export type ResumeAnalysis = {
  metadata?: {
    analysis_version?: string;
    generated_at?: string;
    parser_type?: string;
  };
  candidate_name: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  skills: string[];
  programming_languages: string[];
  frameworks_and_libraries: string[];
  tools_and_platforms: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
};

export type ResumeListResponse = {
  resumes: Resume[];
};

export type InterviewQuestion = {
  id: string;
  question_text: string;
  user_answer: string | null;
  sequence_number: number;
};

export type Interview = {
  id: string;
  interview_type: string;
  difficulty: string;
  status: "in_progress" | "completed" | string;
  started_at: string | null;
  completed_at: string | null;
  answered_count: number;
  total_questions: number;
  questions: InterviewQuestion[];
};

export type InterviewListResponse = {
  interviews: Interview[];
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

export async function getInterviews(token?: string): Promise<Interview[]> {
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${apiUrl}/api/interviews`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Partial<InterviewListResponse>;
    return Array.isArray(data.interviews) ? data.interviews : [];
  } catch {
    return [];
  }
}

export async function getInterview(
  token: string | undefined,
  interviewId: string,
): Promise<Interview | null> {
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/api/interviews/${interviewId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Interview;
  } catch {
    return null;
  }
}
