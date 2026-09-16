"""
Persistent knowledge graph (spec section 9): every concept ever surfaced,
plus Hamza's own projects/technologies, as nodes and typed edges.

In-memory for the prototype; the shape here maps directly onto a
Postgres graph-relational model (two tables: `graph_nodes`, `graph_edges`)
— see db/schema.sql — or a Neo4j graph later if traversal queries get
complex enough to want a real graph engine. Nothing above this service
needs to know which.
"""
from __future__ import annotations

from app.models.schemas import ConceptEdge, ConceptNode, KnowledgeGraphResponse

# Seed nodes describing Hamza's own work, per spec section 9's example tree
# (HAMZA -> DocuAI -> OCR/NER/RAG, HAMZA -> AI Agents -> ..., etc).
SEED_NODES: list[ConceptNode] = [
    ConceptNode(id="hamza", label="HAMZA", depth=0, origin="core-topic", weight=1.6),
    ConceptNode(id="docuai", label="DOCUAI", depth=1, origin="core-topic", weight=1.1),
    ConceptNode(id="ocr", label="OCR", depth=2, origin="core-topic", weight=0.9),
    ConceptNode(id="ner", label="NER", depth=2, origin="core-topic", weight=0.9),
    ConceptNode(id="rag", label="RAG", depth=2, origin="core-topic", weight=0.9),
    ConceptNode(id="vector-db", label="VECTOR DATABASE", depth=2, origin="core-topic", weight=0.9),
    ConceptNode(id="agents", label="AI AGENTS", depth=1, origin="core-topic", weight=1.1),
    ConceptNode(id="harness", label="AGENT HARNESS", depth=2, origin="core-topic", weight=0.9),
    ConceptNode(id="sandboxing", label="SANDBOXING", depth=2, origin="core-topic", weight=0.9),
    ConceptNode(id="philosophy", label="PHILOSOPHY", depth=1, origin="core-topic", weight=1.0),
    ConceptNode(id="cv", label="COMPUTER VISION", depth=1, origin="core-topic", weight=1.0),
]

SEED_EDGES: list[ConceptEdge] = [
    ConceptEdge(id="hamza-docuai", source="hamza", target="docuai", relation="BUILT_WITH"),
    ConceptEdge(id="docuai-ocr", source="docuai", target="ocr", relation="EXPLORES"),
    ConceptEdge(id="docuai-ner", source="docuai", target="ner", relation="EXPLORES"),
    ConceptEdge(id="docuai-rag", source="docuai", target="rag", relation="EXPLORES"),
    ConceptEdge(id="docuai-vectordb", source="docuai", target="vector-db", relation="BUILT_WITH"),
    ConceptEdge(id="hamza-agents", source="hamza", target="agents", relation="BUILT_WITH"),
    ConceptEdge(id="agents-harness", source="agents", target="harness", relation="EXPLORES"),
    ConceptEdge(id="agents-sandboxing", source="agents", target="sandboxing", relation="EXPLORES"),
    ConceptEdge(id="hamza-philosophy", source="hamza", target="philosophy", relation="INSPIRED_BY"),
    ConceptEdge(id="hamza-cv", source="hamza", target="cv", relation="BUILT_WITH"),
]


class KnowledgeGraphService:
    def __init__(self) -> None:
        self._nodes: dict[str, ConceptNode] = {n.id: n for n in SEED_NODES}
        self._edges: dict[str, ConceptEdge] = {e.id: e for e in SEED_EDGES}

    def get_graph(self) -> KnowledgeGraphResponse:
        return KnowledgeGraphResponse(nodes=list(self._nodes.values()), edges=list(self._edges.values()))

    def merge(self, nodes: list[ConceptNode], edges: list[ConceptEdge]) -> None:
        """Fold newly-surfaced conversation concepts into the persistent graph,
        deduping by label so a revisited concept strengthens an existing node
        rather than spawning a duplicate (mirrors useThoughtGraph.ts)."""
        label_to_id = {n.label: n.id for n in self._nodes.values()}
        remap: dict[str, str] = {}

        for node in nodes:
            existing_id = label_to_id.get(node.label)
            if existing_id:
                remap[node.id] = existing_id
                self._nodes[existing_id].weight += 0.3
            else:
                self._nodes[node.id] = node
                label_to_id[node.label] = node.id

        for edge in edges:
            source = remap.get(edge.source, edge.source)
            target = remap.get(edge.target, edge.target)
            key = f"{source}->{target}"
            if key not in self._edges and f"{target}->{source}" not in self._edges:
                self._edges[key] = ConceptEdge(id=key, source=source, target=target, relation=edge.relation)


knowledge_graph_service = KnowledgeGraphService()
