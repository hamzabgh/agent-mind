/**
 * Shared type definitions for the FACE / MIND / WORLD interface.
 */

/** The AI's state machine. Each state drives completely different visual behavior. */
export type AIState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'EXCITED'
  | 'DEEP_THOUGHT'
  | 'CONNECTED'
  | 'ERROR';

/** A single node in the concept / knowledge graph. */
export interface ConceptNode {
  id: string;
  label: string;
  /** 0 = seed / most central, higher = further from the original question */
  depth: number;
  /** Position is assigned by the layout engine, not authored. */
  position: [number, number, number];
  /** Where this concept came from — lets the World layer style it differently. */
  origin: 'question' | 'answer' | 'core-topic';
  /** Turn index this concept first appeared in — used to fade older nodes in WORLD. */
  createdAt: number;
  weight: number;
}

/** A relationship between two concepts. */
export interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  relation:
    | 'RELATED_TO'
    | 'BUILT_WITH'
    | 'INSPIRED_BY'
    | 'EXPLORES'
    | 'WRITTEN_IN'
    | 'CONNECTED_TO';
  /** 0..1 reveal progress, animated as the connection "forms". */
  progress: number;
}

/** Output of the (mock, later real) AI reasoning pipeline. */
export interface AIThought {
  query: string;
  concepts: ConceptNode[];
  edges: ConceptEdge[];
  /** Short, cinematic, spoken/floating insight text. */
  insight: string;
  /** Longer text available on expand. */
  fullText: string;
  /** Optional source citations once RAG is wired to real documents. */
  sources?: { title: string; url?: string }[];
}

/** Frequency-band energy extracted by the audio engine, normalized 0..1. */
export interface AudioBands {
  amplitude: number;
  rms: number;
  bass: number;
  mid: number;
  high: number;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'ai';
  text: string;
  createdAt: number;
}
