from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HireMind API"
    environment: str = Field(
        default="development",
        validation_alias=AliasChoices("APP_ENV", "BACKEND_APP_ENV"),
    )
    cors_origins: list[str] = ["http://localhost:3000"]
    trusted_hosts: list[str] = ["localhost", "127.0.0.1", "testserver"]
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

    @field_validator("cors_origins")
    @classmethod
    def normalize_cors_origins(cls, value: list[str]) -> list[str]:
        return [origin.rstrip("/") for origin in value if origin.strip()]

    @field_validator("trusted_hosts")
    @classmethod
    def normalize_trusted_hosts(cls, value: list[str]) -> list[str]:
        return [host.strip() for host in value if host.strip()]

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        is_production = self.environment.lower() in {"production", "prod"}
        if not is_production:
            return self

        if not self.google_client_id:
            raise ValueError("GOOGLE_CLIENT_ID is required in production")
        if (
            not self.session_secret
            or self.session_secret == "replace-with-a-long-random-secret"
            or len(self.session_secret) < 32
        ):
            raise ValueError("SESSION_SECRET must be a strong production secret")
        if "example.neon.tech" in self.database_url or "user:password" in self.database_url:
            raise ValueError("DATABASE_URL must be configured for production")
        if "*" in self.cors_origins:
            raise ValueError("Wildcard CORS origins are not allowed in production")
        if not self.cors_origins:
            raise ValueError("At least one CORS origin is required in production")
        if "*" in self.trusted_hosts:
            raise ValueError("Wildcard trusted hosts are not allowed in production")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BACKEND_",
        extra="ignore",
    )


settings = Settings()
