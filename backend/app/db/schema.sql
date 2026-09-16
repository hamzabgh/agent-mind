-- PostgreSQL + pgvector schema sketch (spec sections 7-9).
-- Not auto-applied by anything yet — run manually or wire into a migration
-- tool (alembic) once the services below actually talk to a real DB
-- connection instead of the in-memory placeholders they use today.

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------
-- RAG: Hamza's own documents (CV, repo READMEs, blog posts, notes)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    source      TEXT NOT NULL,          -- e.g. 'github:hamza/docuai/README.md'
    url         TEXT,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,
    content      TEXT NOT NULL,
    embedding    vector(384)            -- match EMBEDDING_DIM in embedding_service.py
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ---------------------------------------------------------------------
-- Memory: long-term, user-scoped (spec section 8)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS long_term_memory (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_session_id  TEXT NOT NULL,
    text             TEXT NOT NULL,
    category         TEXT,              -- 'preference' | 'fact' | 'topic_interest' | 'correction'
    importance       REAL NOT NULL,
    embedding        vector(384),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Knowledge graph: PostgreSQL graph-relational model (spec section 9).
-- Swap for Neo4j only if traversal queries outgrow simple joins/CTEs.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS graph_nodes (
    id          TEXT PRIMARY KEY,
    label       TEXT NOT NULL,
    node_type   TEXT NOT NULL,          -- 'concept' | 'project' | 'technology' | 'article' | 'person'
    weight      REAL NOT NULL DEFAULT 1.0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS graph_edges (
    id          TEXT PRIMARY KEY,
    source_id   TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_id   TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    relation    TEXT NOT NULL,          -- RELATED_TO | BUILT_WITH | INSPIRED_BY | EXPLORES | WRITTEN_IN | CONNECTED_TO
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS graph_edges_source_idx ON graph_edges(source_id);
CREATE INDEX IF NOT EXISTS graph_edges_target_idx ON graph_edges(target_id);
