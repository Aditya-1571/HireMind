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

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BACKEND_",
        extra="ignore",
    )


settings = Settings()
