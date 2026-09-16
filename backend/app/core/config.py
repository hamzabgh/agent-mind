"""
Central, provider-agnostic settings. Nothing in the app should import
`openai` or `anthropic` directly outside of `services/llm_service.py` — every
other module talks to the `LLMService` interface so swapping providers, or
running fully local, never touches API/route code.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "hamza-ai-interface"
    environment: str = "development"

    # --- LLM provider (see services/llm_service.py) ---------------------
    llm_provider: str = "mock"  # "mock" | "openai" | "anthropic" | "local"
    llm_model: str = "gpt-4o-mini"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    local_model_url: str | None = None  # e.g. an Ollama / vLLM endpoint

    # --- Embeddings (see services/embedding_service.py) -----------------
    embedding_provider: str = "mock"  # "mock" | "openai" | "local"
    embedding_model: str = "text-embedding-3-small"

    # --- Storage ----------------------------------------------------------
    database_url: str = "postgresql+asyncpg://hamza:hamza@localhost:5432/hamza_ai"
    vector_backend: str = "pgvector"  # "pgvector" | "qdrant"
    qdrant_url: str | None = None

    # --- Auth ---------------------------------------------------------------
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"

    # --- CORS -----------------------------------------------------------
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
