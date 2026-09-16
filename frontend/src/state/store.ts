/**
 * A minimal hand-rolled observable store — deliberately not Redux/Zustand.
 *
 * WHY: the render loop for the AI entity needs audio levels and state at
 * 60fps. Routing that through React state would cause a re-render storm on
 * every animation frame. Instead, R3F components read `store.getState()`
 * inside `useFrame` (which already runs outside React's render cycle), and
 * only "chrome" UI (HUD, status dot, thought text) subscribes via the
 * `useStore` hook so it re-renders on meaningful, low-frequency changes.
 */
import { useEffect, useState } from 'react';
import type { AIState, AIThought, AudioBands, ConceptEdge, ConceptNode, ConversationTurn } from '@/types';

export interface WorldGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface AppState {
  aiState: AIState;
  previousAiState: AIState;
  statusMessage: string;
  audio: AudioBands;
  currentThought: AIThought | null;
  thoughtVisible: boolean;
  thoughtExpanded: boolean;
  transcript: string;
  interimTranscript: string;
  conversation: ConversationTurn[];
  world: WorldGraph;
  view: 'FACE' | 'MIND' | 'WORLD';
  turnCount: number;
  errorMessage: string | null;
}

type Listener = (s: AppState) => void;

const initialState: AppState = {
  aiState: 'IDLE',
  previousAiState: 'IDLE',
  statusMessage: '',
  audio: { amplitude: 0, rms: 0, bass: 0, mid: 0, high: 0 },
  currentThought: null,
  thoughtVisible: false,
  thoughtExpanded: false,
  transcript: '',
  interimTranscript: '',
  conversation: [],
  world: { nodes: [], edges: [] },
  view: 'FACE',
  turnCount: 0,
  errorMessage: null,
};

class Store {
  private state: AppState = { ...initialState };
  private listeners = new Set<Listener>();

  getState() {
    return this.state;
  }

  setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    const resolved = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...resolved };
    this.listeners.forEach((l) => l(this.state));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setAIState(next: AIState, statusMessage = '') {
    if (next === this.state.aiState) return;
    this.setState({ previousAiState: this.state.aiState, aiState: next, statusMessage });
  }

  /** Called every audio frame — intentionally does NOT go through React. */
  setAudio(bands: AudioBands) {
    this.state = { ...this.state, audio: bands };
    // Deliberately not notifying React listeners here (see file header).
  }
}

export const store = new Store();

/**
 * React binding with a selector, so UI components only re-render when the
 * slice they care about actually changes.
 */
export function useStore<T>(selector: (s: AppState) => T): T {
  const [selected, setSelected] = useState(() => selector(store.getState()));

  useEffect(() => {
    return store.subscribe((s) => {
      const next = selector(s);
      setSelected((prev) => (Object.is(prev, next) ? prev : next));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return selected;
}
