"""
Long-term memory pipeline (spec section 8):

    conversation -> importance detection -> memory candidate -> store/reject -> knowledge graph

Three separate stores, never conflated:
  - SHORT-TERM: the current conversation turns. Lives in the frontend /
    request payload, not persisted here.
  - LONG-TERM: durable facts about the *user* (preferences, recurring
    interests, corrections they've made). Everything here passed the
    importance filter below.
  - KNOWLEDGE: Hamza's own portfolio/projects/articles — not user-derived at
    all, populated by `rag_service.py` from real documents, not from chat.

This module intentionally does NOT persist anything yet (see README.md,
"Wiring up Postgres") — `score_importance` and `MemoryStore` are written so
that hooking in a real asyncpg connection is additive, not a rewrite.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.models.schemas import MemoryCandidate

# Heuristic v0 — replace with a small classifier prompt to the LLM service
# once a real provider is wired in ("is this worth remembering, and why?").
IMPORTANT_PATTERNS = [
    (re.compile(r"\bi (?:prefer|like|love|hate|dislike)\b", re.I), "preference", 0.7),
    (re.compile(r"\bmy name is\b", re.I), "fact", 0.9),
    (re.compile(r"\bi work (?:at|on|with)\b", re.I), "fact", 0.6),
    (re.compile(r"\b(?:actually|correction|i meant)\b", re.I), "correction", 0.8),
    (re.compile(r"\b(?:always|remember that|for future reference)\b", re.I), "preference", 0.75),
]

REJECT_BELOW = 0.5


def score_importance(text: str, conversation_id: str) -> MemoryCandidate:
    """Returns a scored candidate; caller decides store-vs-reject at REJECT_BELOW."""
    best_score = 0.0
    best_category: str | None = None
    for pattern, category, score in IMPORTANT_PATTERNS:
        if pattern.search(text) and score > best_score:
            best_score = score
            best_category = category

    # mild boost for longer, declarative statements over short chatter
    if len(text.split()) > 14:
        best_score = min(1.0, best_score + 0.1)

    return MemoryCandidate(
        text=text,
        conversation_id=conversation_id,
        importance=round(best_score, 2),
        category=best_category,  # type: ignore[arg-type]
    )


@dataclass
class MemoryStore:
    """In-memory placeholder for the long-term memory table.
    Swap for a real `long_term_memory` Postgres table (see db/schema.sql)."""

    _items: list[MemoryCandidate] = field(default_factory=list)

    def maybe_store(self, candidate: MemoryCandidate) -> bool:
        if candidate.importance < REJECT_BELOW:
            return False
        self._items.append(candidate)
        return True

    def all(self) -> list[MemoryCandidate]:
        return list(self._items)


memory_store = MemoryStore()
