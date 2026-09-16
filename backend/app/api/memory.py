from fastapi import APIRouter

from app.models.schemas import MemoryCandidate
from app.services.memory_service import memory_store

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("", response_model=list[MemoryCandidate])
async def list_memories() -> list[MemoryCandidate]:
    """Long-term memory only — short-term (current conversation) memory
    lives in the frontend/client and is never persisted here."""
    return memory_store.all()
