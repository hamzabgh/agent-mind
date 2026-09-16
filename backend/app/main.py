"""
FastAPI entrypoint. Deliberately thin — routers own their endpoints,
services own logic, this file only wires CORS + routers together.

Run: uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, knowledge, memory, projects, voice
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Hamza Boughanim — Digital Consciousness API",
    description="Backend for the FACE/MIND/WORLD interface. See backend/README.md.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(memory.router)
app.include_router(knowledge.router)
app.include_router(projects.router)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "llm_provider": settings.llm_provider}
