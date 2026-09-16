"""
Pydantic mirrors of frontend/src/types/index.ts. Keep these two files in
sync by hand for now (the surface is small); if it grows, generate the TS
types from these schemas instead of maintaining both directions.
"""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel

AIState = Literal[
    "IDLE", "LISTENING", "THINKING", "SPEAKING", "EXCITED", "DEEP_THOUGHT", "CONNECTED", "ERROR"
]

Relation = Literal[
    "RELATED_TO", "BUILT_WITH", "INSPIRED_BY", "EXPLORES", "WRITTEN_IN", "CONNECTED_TO"
]


class ConceptNode(BaseModel):
    id: str
    label: str
    depth: int
    origin: Literal["question", "answer", "core-topic"]
    weight: float = 1.0


class ConceptEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: Relation = "RELATED_TO"


class Source(BaseModel):
    title: str
    url: str | None = None


class ChatRequest(BaseModel):
    query: str
    conversation_id: str | None = None
    turn_index: int = 1


class ChatResponse(BaseModel):
    """
    Shape returned to the frontend — deliberately matches `AIThought` in
    src/types/index.ts so swapping src/lib/mockAI.ts for a `fetch('/api/chat')`
    call is a near-zero-diff change. NEVER include hidden chain-of-thought
    here — only the high-level concepts/edges/insight the UI is allowed to
    visualize, mirroring the product rule in mockAI.ts.
    """
    query: str
    concepts: list[ConceptNode]
    edges: list[ConceptEdge]
    insight: str
    full_text: str
    sources: list[Source] | None = None


class MemoryCandidate(BaseModel):
    text: str
    conversation_id: str
    importance: float
    category: Literal["preference", "fact", "topic_interest", "correction"] | None = None


class KnowledgeGraphResponse(BaseModel):
    nodes: list[ConceptNode]
    edges: list[ConceptEdge]
