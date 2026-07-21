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
  skills: string[] | ResumeSkillCategories;
  skills_categorized?: ResumeSkillCategories;
  programming_languages: string[];
  ml_ai?: string[];
  frameworks_and_libraries: string[];
  tools_and_platforms: string[];
  databases?: string[];
  cloud_devops?: string[];
  education: string[];
  experience: string[] | ResumeExperience[];
  projects: string[] | ResumeProject[];
  certifications: string[];
  achievements?: string[];
};

export type ResumeSkillCategories = {
  programming_languages?: string[];
  ml_ai?: string[];
  frameworks_libraries?: string[];
  tools_platforms?: string[];
  databases?: string[];
  cloud_devops?: string[];
  other?: string[];
};

export type ResumeProject = {
  name: string;
  description: string[];
  technologies: string[];
};

export type ResumeExperience = {
  organization: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  description: string[];
  experience_type: "job" | "internship" | "virtual_internship" | "simulation" | string;
};

export type ResumeListResponse = {
  resumes: Resume[];
};

export type InterviewQuestion = {
  id: string;
  question_text: string;
  user_answer: string | null;
  feedback: string | null;
  score: number | null;
  sequence_number: number;
};

export type QuestionEvaluation = {
  sequence_number: number;
  score: number;
  feedback: string;
  strength: string;
  improvement: string;
};

export type Interview = {
  id: string;
  interview_type: string;
  difficulty: string;
  target_role: string;
  status: "in_progress" | "completed" | string;
  started_at: string | null;
  completed_at: string | null;
  answered_count: number;
  total_questions: number;
  questions: InterviewQuestion[];
  overall_score: number | null;
  overall_feedback: string | null;
  strengths: string[];
  improvements: string[];
  question_evaluations: QuestionEvaluation[];
};

export type InterviewSummary = {
  id: string;
  target_role: string;
  interview_type: string;
  difficulty: string;
  status: "in_progress" | "completed" | string;
  overall_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  resume_filename: string | null;
  answered_count: number;
  total_questions: number;
};

export type CreatedInterview = Interview & {
  generation_source: "ai" | "fallback";
};

export type CompletedInterview = Interview & {
  evaluation_source: "ai" | "fallback";
};

export type InterviewListResponse = {
  interviews: InterviewSummary[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type InterviewListParams = {
  page?: number;
  page_size?: number;
  status?: string;
  interview_type?: string;
  difficulty?: string;
  target_role?: string;
  sort?: string;
};

export type ScoreTrendItem = {
  interview_id: string;
  date: string;
  target_role: string;
  interview_type: string;
  score: number;
};

export type ScoreByTypeItem = {
  interview_type: string;
  average_score: number;
  count: number;
};

export type InterviewAnalyticsSummary = {
  total_interviews: number;
  completed_interviews: number;
  in_progress_interviews: number;
  average_completed_score: number | null;
  highest_score: number | null;
  latest_completed_score: number | null;
  most_practised_target_role: string | null;
  score_trend: ScoreTrendItem[];
  average_score_by_type: ScoreByTypeItem[];
};

export type AiHealth = {
  status: "ok" | "unavailable" | string;
  ollama_reachable: boolean;
  model: string;
  model_available: boolean;
};

export type AiGeneration = {
  model: string;
  generated_text: string;
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

function buildInterviewSearch(params?: InterviewListParams) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function getInterviewSummaries(
  token?: string,
  params?: InterviewListParams,
): Promise<InterviewListResponse> {
  const empty = {
    interviews: [],
    page: params?.page ?? 1,
    page_size: params?.page_size ?? 10,
    total: 0,
    total_pages: 0,
  };

  if (!token) {
    return empty;
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/interviews${buildInterviewSearch(params)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return empty;
    }

    const data = (await response.json()) as Partial<InterviewListResponse>;
    return {
      interviews: Array.isArray(data.interviews) ? data.interviews : [],
      page: typeof data.page === "number" ? data.page : empty.page,
      page_size:
        typeof data.page_size === "number" ? data.page_size : empty.page_size,
      total: typeof data.total === "number" ? data.total : 0,
      total_pages: typeof data.total_pages === "number" ? data.total_pages : 0,
    };
  } catch {
    return empty;
  }
}

export async function getInterviewAnalyticsSummary(
  token?: string,
): Promise<InterviewAnalyticsSummary | null> {
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/api/interviews/analytics/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as InterviewAnalyticsSummary;
  } catch {
    return null;
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

export async function getAiHealth(): Promise<AiHealth> {
  try {
    const response = await fetch(`${apiUrl}/api/ai/health`, {
      cache: "no-store",
    });
    const data = (await response.json()) as Partial<AiHealth>;

    return {
      status: typeof data.status === "string" ? data.status : "unavailable",
      ollama_reachable: data.ollama_reachable === true,
      model: typeof data.model === "string" ? data.model : "unknown",
      model_available: data.model_available === true,
    };
  } catch {
    return {
      status: "unavailable",
      ollama_reachable: false,
      model: "unknown",
      model_available: false,
    };
  }
}
