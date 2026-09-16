from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse
from app.services.knowledge_graph_service import knowledge_graph_service
from app.services.memory_service import memory_store, score_importance
from app.services.rag_service import think

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    The one endpoint src/lib/mockAI.ts's `think()` is designed to be replaced
    by. Response shape is identical to the frontend's `AIThought` type, so
    swapping the frontend call is a one-line change (see backend/README.md).
    """
    result = await think(request.query)

    # fold this turn's concepts into the persistent world graph
    knowledge_graph_service.merge(result.concepts, result.edges)

    # memory scoring pipeline (spec section 8) — runs on the user's own
    # message, not the AI's answer
    candidate = score_importance(request.query, request.conversation_id or "anonymous")
    memory_store.maybe_store(candidate)

    return result
