from dataclasses import dataclass
from typing import Any

import requests


TEST_GENERATION_PROMPT = (
    "Reply in one short sentence: HireMind AI connection test successful."
)


class OllamaUnavailableError(Exception):
    pass


class OllamaModelMissingError(Exception):
    pass


class OllamaGenerationTimeoutError(Exception):
    pass


class OllamaGenerationError(Exception):
    pass


@dataclass(frozen=True)
class OllamaHealth:
    status: str
    ollama_reachable: bool
    model: str
    model_available: bool


@dataclass(frozen=True)
class OllamaGeneration:
    model: str
    generated_text: str


class OllamaClient:
    def __init__(self, base_url: str, model: str, timeout_seconds: int) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = max(1, timeout_seconds)

    def _url(self, path: str) -> str:
        return f"{self.base_url}/{path.lstrip('/')}"

    def _get_tags(self) -> list[dict[str, Any]]:
        try:
            response = requests.get(
                self._url("/api/tags"),
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise OllamaUnavailableError from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise OllamaUnavailableError from exc
        models = payload.get("models")
        return models if isinstance(models, list) else []

    def check_health(self) -> OllamaHealth:
        models = self._get_tags()
        model_names = {
            model.get("name")
            for model in models
            if isinstance(model, dict) and isinstance(model.get("name"), str)
        }
        model_available = self.model in model_names

        if not model_available:
            raise OllamaModelMissingError

        return OllamaHealth(
            status="ok",
            ollama_reachable=True,
            model=self.model,
            model_available=True,
        )

    def generate_test_response(self) -> OllamaGeneration:
        payload = {
            "model": self.model,
            "prompt": TEST_GENERATION_PROMPT,
            "stream": False,
            "options": {
                "num_predict": 40,
                "temperature": 0,
            },
        }

        try:
            response = requests.post(
                self._url("/api/generate"),
                json=payload,
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
        except requests.Timeout as exc:
            raise OllamaGenerationTimeoutError from exc
        except requests.RequestException as exc:
            raise OllamaGenerationError from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise OllamaGenerationError from exc
        generated_text = data.get("response")
        if not isinstance(generated_text, str):
            raise OllamaGenerationError

        return OllamaGeneration(
            model=self.model,
            generated_text=generated_text.strip()[:500],
        )

    def generate_structured_response(
        self,
        prompt: str,
        response_format: str | dict[str, Any] = "json",
        num_predict: int = 700,
        temperature: float = 0.1,
    ) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": response_format,
            "options": {
                "num_predict": max(1, min(num_predict, 4000)),
                "temperature": temperature,
            },
        }

        try:
            response = requests.post(
                self._url("/api/generate"),
                json=payload,
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
        except requests.Timeout as exc:
            raise OllamaGenerationTimeoutError from exc
        except requests.RequestException as exc:
            raise OllamaGenerationError from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise OllamaGenerationError from exc
        generated_text = data.get("response")
        if not isinstance(generated_text, str):
            raise OllamaGenerationError
        return generated_text.strip()


def build_ollama_client(
    base_url: str,
    model: str,
    timeout_seconds: int,
) -> OllamaClient:
    return OllamaClient(
        base_url=base_url,
        model=model,
        timeout_seconds=timeout_seconds,
    )
