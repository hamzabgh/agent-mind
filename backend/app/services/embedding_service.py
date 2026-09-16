"""
Provider-agnostic embeddings for the RAG layer. Same pattern as
llm_service.py: routes/services depend on `EmbeddingService`, never on a
specific SDK, so the vector backend (pgvector vs Qdrant) and the embedding
provider (OpenAI vs a local sentence-transformers model) can each change
independently.
"""
from __future__ import annotations

import hashlib
import math
from abc import ABC, abstractmethod
from functools import lru_cache

from app.core.config import get_settings

EMBEDDING_DIM = 384


class EmbeddingService(ABC):
    @abstractmethod
    async def embed(self, text: str) -> list[float]: ...

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [await self.embed(t) for t in texts]


class MockEmbeddingService(EmbeddingService):
    """
    Deterministic hash-based pseudo-embedding — NOT semantically meaningful,
    just stable and dependency-free so `rag_service.py` has something to
    cosine-compare against before a real embedding model is wired in.
    """

    async def embed(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.lower().encode()).digest()
        # expand the 32-byte digest into EMBEDDING_DIM pseudo-random floats in [-1, 1]
        values = []
        for i in range(EMBEDDING_DIM):
            byte = digest[i % len(digest)]
            values.append(((byte / 255.0) * 2 - 1))
        norm = math.sqrt(sum(v * v for v in values)) or 1.0
        return [v / norm for v in values]


class OpenAIEmbeddingService(EmbeddingService):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def embed(self, text: str) -> list[float]:
        # TODO: AsyncOpenAI().embeddings.create(model=self.model, input=text)
        raise NotImplementedError("Install `openai` and implement OpenAIEmbeddingService.embed")


@lru_cache
def get_embedding_service() -> EmbeddingService:
    settings = get_settings()
    if settings.embedding_provider == "openai":
        # falls back to mock if no key configured, so the app still boots
        return MockEmbeddingService()
    return MockEmbeddingService()
