from fastapi import APIRouter

from app.models.schemas import KnowledgeGraphResponse
from app.services.knowledge_graph_service import knowledge_graph_service

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("/graph", response_model=KnowledgeGraphResponse)
async def get_graph() -> KnowledgeGraphResponse:
    """Backs the WORLD layer's KnowledgeGraph.tsx once it fetches instead of
    reading purely from client-side conversation state."""
    return knowledge_graph_service.get_graph()
