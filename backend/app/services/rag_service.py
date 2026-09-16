"""
Retrieval-augmented reasoning over Hamza's own documents.

This is the real-backend equivalent of frontend/src/lib/mockAI.ts +
knowledgeBase.ts. The document list below stands in for "CV, GitHub READMEs,
blog posts, research notes" until those are actually ingested (see
README.md, "Ingesting real documents"). Swap `DOCUMENTS` for rows pulled
from Postgres (`documents` table, see db/schema.sql) and `_cosine_search`
keeps working unchanged against pgvector via a real SQL query instead of
an in-memory loop.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass

from app.models.schemas import ChatResponse, ConceptEdge, ConceptNode, Source
from app.services.embedding_service import get_embedding_service
from app.services.llm_service import get_llm_service


@dataclass
class Document:
    id: str
    title: str
    text: str
    source: str


DOCUMENTS: list[Document] = [
    Document(
        "docuai",
        "DocuAI — document intelligence pipeline",
        "DocuAI combines OCR, named-entity recognition, and a RAG layer over a "
        "vector database to turn unstructured documents into cited, queryable knowledge.",
        "portfolio:projects/docuai",
    ),
    Document(
        "agents",
        "AI Agents — harness and sandboxing",
        "Work on AI agents focuses on the harness around the model: tool-use loops, "
        "sandboxed execution, and guardrails for safe autonomous action.",
        "portfolio:projects/agents",
    ),
    Document(
        "mlops",
        "MLOps practice",
        "Reproducible training pipelines, model versioning, and deployment "
        "infrastructure that keeps ML systems observable in production.",
        "portfolio:notes/mlops",
    ),
]

# A small keyword -> concept-web map, standing in for what would otherwise be
# a real LLM call asked to extract concepts. This keeps the fully-mocked
# backend path (no API keys configured) demoable end-to-end.
_TOPIC_CONCEPTS: dict[str, list[str]] = {
    "conscious": ["CONSCIOUSNESS", "INTELLIGENCE", "MEMORY", "SELF", "PERCEPTION"],
    "creativ": ["AI", "CREATIVITY", "HUMAN", "IMAGINATION", "COLLABORATION"],
    "memory": ["MEMORY", "TIME", "IDENTITY", "EXPERIENCE"],
    "agent": ["AI AGENTS", "AUTONOMY", "TOOLS", "SANDBOXING", "TRUST"],
    "rag": ["RAG", "EMBEDDINGS", "KNOWLEDGE", "TRUTH"],
}
_DEFAULT_CONCEPTS = ["CURIOSITY", "AI", "SCIENCE", "HUMAN", "EXPLORATION"]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


async def _cosine_search(query: str, top_k: int = 2) -> list[Document]:
    embedder = get_embedding_service()
    query_vec = await embedder.embed(query)
    scored = []
    for doc in DOCUMENTS:
        doc_vec = await embedder.embed(doc.text)
        scored.append((doc, _cosine(query_vec, doc_vec)))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [doc for doc, _score in scored[:top_k]]


def _pick_concepts(query: str) -> list[str]:
    q = query.lower()
    for keyword, concepts in _TOPIC_CONCEPTS.items():
        if keyword in q:
            return concepts
    return _DEFAULT_CONCEPTS


async def think(query: str) -> ChatResponse:
    """
    The real-backend counterpart of the frontend's mock `think()`. Structure
    matters more than the current (mocked) content: retrieve -> concepts ->
    edges -> insight -> sources, with the LLM asked ONLY for a user-facing
    answer — never for its reasoning trace (see llm_service.py docstring).
    """
    matched_docs = await _cosine_search(query)
    concepts_labels = _pick_concepts(query)

    concepts = [
        ConceptNode(
            id=f"n{i}",
            label=label,
            depth=0 if i == 0 else 1,
            origin="question" if i == 0 else "answer",
            weight=1.4 if i == 0 else 1.0,
        )
        for i, label in enumerate(concepts_labels)
    ]
    edges = [
        ConceptEdge(id=f"e{i}", source=concepts[0].id, target=concepts[i].id)
        for i in range(1, len(concepts))
    ]

    llm = get_llm_service()
    insight = await llm.complete(
        system=(
            "You are the voice behind Hamza Boughanim's portfolio interface. "
            "Answer in one short, precise, slightly philosophical sentence. "
            "Never reveal step-by-step reasoning — only the conclusion."
        ),
        user=query,
    )

    return ChatResponse(
        query=query,
        concepts=concepts,
        edges=edges,
        insight=insight,
        full_text=insight,
        sources=[Source(title=f"{d.title} — {d.source}") for d in matched_docs] or None,
    )
