# Backend — architecture notes

This is deliberately a **skeleton with real interfaces**, not a fully wired
RAG/memory system — per the brief's own instruction to build the frontend
prototype first and layer the backend in after. Every service is written so
plugging in the real thing is additive, not a rewrite.

## Running it

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

With no `.env` changes, everything runs on mock providers — `/api/chat`
returns a real, structurally-correct `ChatResponse` (concepts, edges,
insight, sources) built from a keyword-topic map and a hash-based
pseudo-embedding, so the API is demoable end-to-end with zero external
dependencies or API keys.

## How each piece maps to the spec

| Spec section | File |
|---|---|
| Provider-agnostic LLM | `app/services/llm_service.py` |
| Provider-agnostic embeddings | `app/services/embedding_service.py` |
| RAG over Hamza's documents | `app/services/rag_service.py` |
| Memory scoring pipeline | `app/services/memory_service.py` |
| Knowledge graph | `app/services/knowledge_graph_service.py` |
| Postgres + pgvector schema | `app/db/schema.sql` |
| API surface | `app/api/*.py` |

## Wiring up a real LLM provider

1. `pip install openai` (or `anthropic`), uncomment the matching line in
   `requirements.txt`.
2. Implement the body of `OpenAILLMService.complete` /
   `AnthropicLLMService.complete` in `llm_service.py` — the interface is
   already correct, only the SDK call is stubbed with `NotImplementedError`.
3. Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...` in `.env`.

Nothing else changes: `rag_service.think()` already calls
`get_llm_service().complete(...)`, and `get_llm_service()` picks the
provider from settings.

## Wiring up Postgres + pgvector

1. `docker compose up db` (see root `docker-compose.yml`) or point
   `DATABASE_URL` at an existing Postgres instance with the `vector`
   extension available.
2. Apply `app/db/schema.sql`.
3. Replace the in-memory lists in `rag_service.py` (`DOCUMENTS`),
   `memory_service.py` (`MemoryStore._items`), and
   `knowledge_graph_service.py` (`self._nodes` / `self._edges`) with
   asyncpg/SQLAlchemy queries against the tables in `schema.sql`. The
   public method signatures on each service are already what the API layer
   expects — only the storage inside changes.

Prefer Qdrant over pgvector? `embedding_service.py` and `rag_service.py`
are the only two files that touch vectors — swap `_cosine_search` for a
Qdrant client call and nothing upstream (API routes, frontend contract)
needs to change.

## Ingesting real documents

`rag_service.DOCUMENTS` is a 3-entry placeholder. To ingest Hamza's actual
CV/GitHub READMEs/blog posts: chunk each document (~500 tokens), embed each
chunk with `embedding_service.embed()`, and insert into `document_chunks`
per the schema. A simple ingestion script (`scripts/ingest.py`) is a
reasonable next file to add — it wasn't included here to keep this pass
scoped to the interfaces, not a full CLI tool.

## Memory scoring

`memory_service.score_importance()` is a regex heuristic v0 (see its
docstring). The intended upgrade path is a short LLM prompt — "does this
message contain a durable fact/preference worth remembering, and why?" —
called through the same `llm_service.py` interface, replacing the regex
table with a real judgment call. Keep the `REJECT_BELOW` threshold pattern:
never store everything unconditionally (spec section 8's explicit rule).

## Chain-of-thought discipline

`ChatResponse` (in `models/schemas.py`) and everywhere it's constructed
(`rag_service.think()`) intentionally expose only: concepts, edges, a short
insight, and sources. There is no field for a reasoning trace, and the
system prompt in `rag_service.think()` explicitly tells the model not to
produce one. Keep this contract even as the LLM integration gets more
sophisticated — it's a product requirement (spec section 5), not an
implementation detail.

## Auth

`core/config.py` has `jwt_secret`/`jwt_algorithm` ready, but no auth is
enforced yet — every route is open. This prototype has no concept of user
accounts (it's a single visitor talking to one portfolio's AI), so add a
lightweight session-cookie or anonymous-JWT scheme only if you introduce
something worth gating (e.g. per-visitor long-term memory across sessions).
