from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import login_with_google, read_current_user
from app.api.health import database_health_check, health_check
from app.api.resumes import list_resumes, upload_resume
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
app.add_api_route("/api/auth/google", login_with_google, methods=["POST"])
app.add_api_route("/api/auth/me", read_current_user, methods=["GET"])
app.add_api_route("/api/resumes", list_resumes, methods=["GET"])
app.add_api_route("/api/resumes", upload_resume, methods=["POST"])
