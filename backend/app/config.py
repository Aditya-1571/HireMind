from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HireMind API"
    cors_origins: list[str] = ["http://localhost:3000"]
    google_client_id: str = Field(
        default="",
        validation_alias=AliasChoices("GOOGLE_CLIENT_ID", "BACKEND_GOOGLE_CLIENT_ID"),
    )
    session_secret: str = Field(
        default="replace-with-a-long-random-secret",
        validation_alias=AliasChoices("SESSION_SECRET", "BACKEND_SESSION_SECRET"),
    )
    session_expire_minutes: int = Field(
        default=1440,
        validation_alias=AliasChoices(
            "SESSION_EXPIRE_MINUTES",
            "BACKEND_SESSION_EXPIRE_MINUTES",
        ),
    )
    database_url: str = Field(
        default=(
            "postgresql+psycopg://user:password@example.neon.tech/hiremind"
            "?sslmode=require"
        ),
        validation_alias=AliasChoices("DATABASE_URL", "BACKEND_DATABASE_URL"),
    )
    ollama_base_url: str = Field(
        default="http://127.0.0.1:11434",
        validation_alias=AliasChoices("OLLAMA_BASE_URL", "BACKEND_OLLAMA_BASE_URL"),
    )
    ollama_model: str = Field(
        default="qwen2.5:1.5b",
        validation_alias=AliasChoices("OLLAMA_MODEL", "BACKEND_OLLAMA_MODEL"),
    )
    ollama_timeout_seconds: int = Field(
        default=60,
        validation_alias=AliasChoices(
            "OLLAMA_TIMEOUT_SECONDS",
            "BACKEND_OLLAMA_TIMEOUT_SECONDS",
        ),
    )

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @field_validator("ollama_base_url")
    @classmethod
    def normalize_ollama_base_url(cls, value: str) -> str:
        return value.rstrip("/")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BACKEND_",
        extra="ignore",
    )


settings = Settings()
