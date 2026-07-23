from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.ai.ollama_client import (
    OllamaGenerationError,
    OllamaGenerationTimeoutError,
    OllamaModelMissingError,
    OllamaUnavailableError,
    build_ollama_client,
)
from app.api.auth import get_current_user
from app.config import settings
from app.models import User


class AiHealthResponse(BaseModel):
    status: str
    ollama_reachable: bool
    model: str
    model_available: bool


class AiGenerationResponse(BaseModel):
    model: str
    generated_text: str


def _client():
    return build_ollama_client(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        timeout_seconds=settings.ollama_timeout_seconds,
    )


def ai_health_check():
    client = _client()
    try:
        health = client.check_health()
    except OllamaUnavailableError as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unavailable",
                "ollama_reachable": False,
                "model": settings.ollama_model,
                "model_available": False,
            },
        )
    except OllamaModelMissingError as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unavailable",
                "ollama_reachable": True,
                "model": settings.ollama_model,
                "model_available": False,
            },
        )

    return AiHealthResponse(
        status=health.status,
        ollama_reachable=health.ollama_reachable,
        model=health.model,
        model_available=health.model_available,
    )


def test_ai_generation(
    _current_user: Annotated[User, Depends(get_current_user)],
) -> AiGenerationResponse:
    client = _client()
    try:
        generation = client.generate_test_response()
    except OllamaGenerationTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI generation timed out",
        ) from exc
    except OllamaGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI generation unavailable",
        ) from exc

    return AiGenerationResponse(
        model=generation.model,
        generated_text=generation.generated_text,
    )
