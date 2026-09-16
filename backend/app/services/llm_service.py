"""
Provider-agnostic LLM access. Every route talks to `get_llm_service()`,
never to a provider SDK directly — that's what makes swapping OpenAI /
Anthropic / a local model a one-line config change instead of a rewrite.

IMPORTANT (product rule, not just a technical one): `complete()` returns
plain text for the final *answer*, never a reasoning trace. The concept
graph shown to the user (see rag_service.think()) is built from a small,
explicit prompt asking the model for "5-7 concept words + relations", not
by exposing whatever hidden chain-of-thought a reasoning model produces.
Keep it that way even when you wire up a real provider.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from functools import lru_cache

from app.core.config import get_settings


class LLMService(ABC):
    @abstractmethod
    async def complete(self, system: str, user: str) -> str: ...


class MockLLMService(LLMService):
    """Deterministic stand-in used by default — see src/lib/mockAI.ts for
    the frontend's equivalent, richer canned-topic version."""

    async def complete(self, system: str, user: str) -> str:
        return (
            "This is a mock completion. Set LLM_PROVIDER=openai|anthropic|local "
            "and the matching API key in backend/.env to get real answers."
        )


class OpenAILLMService(LLMService):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def complete(self, system: str, user: str) -> str:
        # TODO: wire up `openai` SDK (AsyncOpenAI) here. Kept unimplemented
        # so this prototype has zero hard dependency on the package until
        # someone actually flips LLM_PROVIDER=openai.
        raise NotImplementedError("Install `openai` and implement OpenAILLMService.complete")


class AnthropicLLMService(LLMService):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def complete(self, system: str, user: str) -> str:
        # TODO: wire up `anthropic` SDK (AsyncAnthropic) here.
        raise NotImplementedError("Install `anthropic` and implement AnthropicLLMService.complete")


class LocalLLMService(LLMService):
    """Talks to a local OpenAI-compatible server (Ollama, vLLM, LM Studio, ...)."""

    def __init__(self, base_url: str, model: str):
        self.base_url = base_url
        self.model = model

    async def complete(self, system: str, user: str) -> str:
        # TODO: httpx.post(f"{self.base_url}/v1/chat/completions", ...)
        raise NotImplementedError("Implement LocalLLMService.complete for your local server")


@lru_cache
def get_llm_service() -> LLMService:
    settings = get_settings()
    if settings.llm_provider == "openai" and settings.openai_api_key:
        return OpenAILLMService(settings.openai_api_key, settings.llm_model)
    if settings.llm_provider == "anthropic" and settings.anthropic_api_key:
        return AnthropicLLMService(settings.anthropic_api_key, settings.llm_model)
    if settings.llm_provider == "local" and settings.local_model_url:
        return LocalLLMService(settings.local_model_url, settings.llm_model)
    return MockLLMService()
