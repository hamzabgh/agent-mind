/**
 * Mock reasoning pipeline.
 *
 * This module is the ONLY thing a real backend integration needs to
 * replace. Its public shape — `think(query) => Promise<AIThought>` — is
 * exactly what a FastAPI `/api/chat` call would return once wired to a real
 * LLM + RAG service (see backend/). Nothing in the visual layer imports
 * from here directly except the orchestrator hook, so swapping this file
 * for a `fetch()` call is a one-line change.
 *
 * IMPORTANT: this intentionally never exposes hidden chain-of-thought. It
 * returns only (a) a short list of high-level concepts, (b) the relations
 * between them, and (c) a final insight — the same contract a real
 * "visualize the concepts, not the reasoning" backend would expose.
 */
import type { AIThought, ConceptEdge, ConceptNode } from '@/types';
import { searchKnowledge } from '@/lib/knowledgeBase';

interface Topic {
  keywords: string[];
  concepts: string[];
  edges: [string, string][];
  insight: string;
  fullText: string;
}

const TOPICS: Topic[] = [
  {
    keywords: ['conscious', 'consciousness', 'sentient', 'sentience', 'aware'],
    concepts: ['CONSCIOUSNESS', 'INTELLIGENCE', 'MEMORY', 'SELF', 'PERCEPTION'],
    edges: [
      ['CONSCIOUSNESS', 'INTELLIGENCE'],
      ['INTELLIGENCE', 'MEMORY'],
      ['INTELLIGENCE', 'SELF'],
      ['MEMORY', 'PERCEPTION'],
      ['SELF', 'PERCEPTION'],
    ],
    insight: 'Consciousness may not be a property of intelligence alone.',
    fullText:
      'Intelligence — the ability to model and act on the world — doesn\'t obviously require an inner experience of doing so. Consciousness might be a separate property that happens to run on some intelligent systems, biological ones included, rather than a guaranteed byproduct of raising a system\'s capability. That gap is exactly why the question stays open even as models get more capable.',
  },
  {
    keywords: ['creativity', 'creative', 'art', 'imagination'],
    concepts: ['AI', 'CREATIVITY', 'HUMAN', 'MEMORY', 'IMAGINATION', 'TOOLS', 'COLLABORATION'],
    edges: [
      ['AI', 'CREATIVITY'],
      ['CREATIVITY', 'HUMAN'],
      ['CREATIVITY', 'IMAGINATION'],
      ['AI', 'TOOLS'],
      ['TOOLS', 'COLLABORATION'],
      ['HUMAN', 'COLLABORATION'],
      ['MEMORY', 'IMAGINATION'],
    ],
    insight: 'AI doesn\'t replace imagination — it changes what\'s cheap to try.',
    fullText:
      'Most creative work is bottlenecked by iteration speed, not raw imagination. When a tool makes exploring a hundred directions as cheap as exploring one, human creativity shifts role — from generating options to recognizing which option is actually worth keeping. That\'s a collaboration, not a replacement, and it changes what "taste" is worth.',
  },
  {
    keywords: ['memory', 'remember', 'forget'],
    concepts: ['MEMORY', 'TIME', 'IDENTITY', 'EXPERIENCE', 'LEARNING'],
    edges: [
      ['MEMORY', 'TIME'],
      ['MEMORY', 'IDENTITY'],
      ['EXPERIENCE', 'MEMORY'],
      ['EXPERIENCE', 'LEARNING'],
      ['LEARNING', 'IDENTITY'],
    ],
    insight: 'A system that never forgets can still fail to learn.',
    fullText:
      'Storage isn\'t memory. Human memory is selective, reconsolidated, and lossy on purpose — it compresses experience into something usable rather than archiving it whole. A useful artificial memory needs the same kind of scoring system: not "store everything," but "decide what\'s worth carrying forward."',
  },
  {
    keywords: ['agent', 'agents', 'autonomous', 'autonomy'],
    concepts: ['AI AGENTS', 'AUTONOMY', 'TOOLS', 'SANDBOXING', 'TRUST'],
    edges: [
      ['AI AGENTS', 'AUTONOMY'],
      ['AI AGENTS', 'TOOLS'],
      ['TOOLS', 'SANDBOXING'],
      ['SANDBOXING', 'TRUST'],
      ['AUTONOMY', 'TRUST'],
    ],
    insight: 'An agent is only as trustworthy as the box it runs in.',
    fullText:
      'The interesting engineering problem in agentic AI isn\'t getting a model to call tools — it\'s building the harness around it: what it\'s allowed to touch, what it can\'t undo, and what a human has to approve. Autonomy scales safely only as fast as sandboxing does.',
  },
  {
    keywords: ['rag', 'retrieval', 'embedding', 'vector', 'search'],
    concepts: ['RAG', 'EMBEDDINGS', 'KNOWLEDGE', 'MEMORY', 'TRUTH'],
    edges: [
      ['RAG', 'EMBEDDINGS'],
      ['EMBEDDINGS', 'KNOWLEDGE'],
      ['RAG', 'KNOWLEDGE'],
      ['KNOWLEDGE', 'TRUTH'],
      ['RAG', 'MEMORY'],
    ],
    insight: 'Retrieval is how a model stays honest about what it doesn\'t know.',
    fullText:
      'A language model\'s weights are a compressed, slightly-blurred memory of its training data. RAG gives it something sharper to point to — real documents, real sources — so an answer can be traced back to where it came from instead of resting on the model\'s confidence alone.',
  },
  {
    keywords: ['nature', 'biology', 'brain', 'neuroscience', 'neuron'],
    concepts: ['NATURE', 'NEURONS', 'INTELLIGENCE', 'EVOLUTION', 'NETWORKS'],
    edges: [
      ['NATURE', 'NEURONS'],
      ['NEURONS', 'INTELLIGENCE'],
      ['NATURE', 'EVOLUTION'],
      ['EVOLUTION', 'NETWORKS'],
      ['NETWORKS', 'INTELLIGENCE'],
    ],
    insight: 'Neural networks borrowed a name from biology and then drifted from it.',
    fullText:
      'An artificial neuron is a rough caricature of a biological one — the metaphor was a starting point, not a blueprint. What both share is more structural than mechanical: intelligence, in either substrate, looks like a network shaped by pressure over time rather than a single clever rule.',
  },
];

const DEFAULT_TOPIC: Topic = {
  keywords: [],
  concepts: ['CURIOSITY', 'AI', 'SCIENCE', 'HUMAN', 'EXPLORATION'],
  edges: [
    ['CURIOSITY', 'AI'],
    ['AI', 'SCIENCE'],
    ['SCIENCE', 'HUMAN'],
    ['CURIOSITY', 'EXPLORATION'],
    ['EXPLORATION', 'HUMAN'],
  ],
  insight: 'Every question is a door into the same room from a different angle.',
  fullText:
    'Ask this system about AI, philosophy, memory, or Hamza\'s own work, and it\'ll try to show you the shape of the concept rather than just define it. That\'s the point of this interface — thinking made visible, not just answered.',
};

function pickTopic(query: string): Topic {
  const q = query.toLowerCase();
  const scored = TOPICS.map((t) => ({
    t,
    score: t.keywords.reduce((acc, k) => acc + (q.includes(k) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].t : DEFAULT_TOPIC;
}

let idCounter = 0;
const nextId = () => `n${++idCounter}`;

export async function think(query: string, turnIndex: number): Promise<AIThought> {
  const topic = pickTopic(query);
  const knowledge = searchKnowledge(query);

  const idByLabel = new Map<string, string>();
  const concepts: ConceptNode[] = topic.concepts.map((label, i) => {
    const id = nextId();
    idByLabel.set(label, id);
    return {
      id,
      label,
      depth: i === 0 ? 0 : 1,
      position: [0, 0, 0],
      origin: i === 0 ? 'question' : 'answer',
      createdAt: turnIndex,
      weight: i === 0 ? 1.4 : 1,
    };
  });

  const edges: ConceptEdge[] = topic.edges.map(([a, b]) => ({
    id: `${idByLabel.get(a)}-${idByLabel.get(b)}`,
    source: idByLabel.get(a)!,
    target: idByLabel.get(b)!,
    relation: 'RELATED_TO',
    progress: 0,
  }));

  // Simulate the natural latency of retrieval + generation so THINKING has room to breathe.
  await new Promise((r) => setTimeout(r, 650 + Math.random() * 400));

  return {
    query,
    concepts,
    edges,
    insight: topic.insight,
    fullText: topic.fullText,
    sources: knowledge.length ? knowledge.map((k) => ({ title: `${k.topic} — ${k.source}` })) : undefined,
  };
}
