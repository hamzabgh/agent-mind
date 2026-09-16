/**
 * Hamza's static "personal knowledge" seed — stands in for the future
 * RAG layer (see backend/README.md). Every entry here is something the
 * real embedding/vector-search service would eventually retrieve from
 * actual documents (CV, repos, articles) with a citeable source.
 */
export interface KnowledgeEntry {
  id: string;
  topic: string;
  tags: string[];
  summary: string;
  source: string;
}

export const HAMZA_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'hamza-profile',
    topic: 'HAMZA',
    tags: ['about', 'who is hamza', 'introduction', 'background'],
    summary:
      'Hamza Boughanim is an AI/ML engineer and full-stack developer. He works across LLMs, computer vision, OCR, RAG, and AI agents, and builds the systems around them — APIs, pipelines, and interfaces — end to end.',
    source: 'portfolio:about',
  },
  {
    id: 'docuai',
    topic: 'DOCUAI',
    tags: ['docuai', 'ocr', 'document', 'ner', 'extraction'],
    summary:
      'DocuAI is a document-intelligence pipeline combining OCR, named-entity recognition, and a RAG layer over a vector database to turn unstructured documents into queryable, cited knowledge.',
    source: 'portfolio:projects/docuai',
  },
  {
    id: 'ai-agents',
    topic: 'AI AGENTS',
    tags: ['agents', 'agent harness', 'sandboxing', 'tool use', 'autonomy'],
    summary:
      'Work on AI agents focuses on the harness around the model: tool-use loops, sandboxed execution, and guardrails that let an autonomous agent act safely inside a real environment.',
    source: 'portfolio:projects/agents',
  },
  {
    id: 'mlops',
    topic: 'MLOPS',
    tags: ['mlops', 'deployment', 'infra', 'pipelines'],
    summary:
      'MLOps practice covers reproducible training pipelines, model versioning, and deployment infrastructure that keeps ML systems observable in production, not just accurate in a notebook.',
    source: 'portfolio:notes/mlops',
  },
  {
    id: 'computer-vision',
    topic: 'COMPUTER VISION',
    tags: ['vision', 'cv', 'image', 'detection'],
    summary:
      'Computer vision work spans detection, OCR pre/post-processing, and applying vision models as one stage in larger multimodal pipelines rather than as standalone demos.',
    source: 'portfolio:projects/vision',
  },
  {
    id: 'philosophy-of-mind',
    topic: 'PHILOSOPHY',
    tags: ['philosophy', 'consciousness', 'mind', 'ethics'],
    summary:
      'A long-running interest outside of shipping code: philosophy of mind, and what — if anything — separates a system that processes information from one that experiences it.',
    source: 'portfolio:notes/philosophy',
  },
];

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const q = query.toLowerCase();
  return HAMZA_KNOWLEDGE.filter((e) => e.tags.some((t) => q.includes(t)) || q.includes(e.topic.toLowerCase()));
}
