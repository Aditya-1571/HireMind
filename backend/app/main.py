from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai import ai_health_check, test_ai_generation
from app.api.auth import login_with_google, read_current_user
from app.api.health import database_health_check, health_check
from app.api.interviews import (
    complete_interview_endpoint,
    create_interview_endpoint,
    get_interview_endpoint,
    get_interview_analytics_summary_endpoint,
    get_interview_report_endpoint,
    list_interviews_endpoint,
    submit_answer_endpoint,
)
from app.api.profile import get_profile_endpoint, patch_profile_endpoint
from app.api.resumes import list_resumes, upload_resume
from app.api.resume_analysis import analyze_resume_endpoint
from app.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_api_route("/api/health/database", database_health_check, methods=["GET"])
app.add_api_route("/api/health", health_check, methods=["GET"])
app.add_api_route("/api/ai/health", ai_health_check, methods=["GET"])
app.add_api_route("/api/ai/test-generation", test_ai_generation, methods=["POST"])
app.add_api_route("/api/auth/google", login_with_google, methods=["POST"])
app.add_api_route("/api/auth/me", read_current_user, methods=["GET"])
app.add_api_route("/api/profile", get_profile_endpoint, methods=["GET"])
app.add_api_route("/api/profile", patch_profile_endpoint, methods=["PATCH"])
app.add_api_route("/api/resumes", list_resumes, methods=["GET"])
app.add_api_route("/api/resumes", upload_resume, methods=["POST"])
app.add_api_route(
    "/api/resumes/{resume_id}/analysis",
    analyze_resume_endpoint,
    methods=["POST"],
)
app.add_api_route("/api/interviews", list_interviews_endpoint, methods=["GET"])
app.add_api_route("/api/interviews", create_interview_endpoint, methods=["POST"])
app.add_api_route(
    "/api/interviews/analytics/summary",
    get_interview_analytics_summary_endpoint,
    methods=["GET"],
)
app.add_api_route(
    "/api/interviews/{interview_id}/report",
    get_interview_report_endpoint,
    methods=["GET"],
)
app.add_api_route(
    "/api/interviews/{interview_id}",
    get_interview_endpoint,
    methods=["GET"],
)
app.add_api_route(
    "/api/interviews/{interview_id}/answers",
    submit_answer_endpoint,
    methods=["POST"],
)
app.add_api_route(
    "/api/interviews/{interview_id}/complete",
    complete_interview_endpoint,
    methods=["POST"],
)
