import { useCallback } from 'react';
import { store, useStore } from '@/state/store';
import type { AIState } from '@/types';

/**
 * Thin React-facing wrapper around the global store's AI state slice.
 */
export function useAIState() {
  const aiState = useStore((s) => s.aiState);
  const statusMessage = useStore((s) => s.statusMessage);

  const setAIState = useCallback((next: AIState, message = '') => {
    store.setAIState(next, message);
  }, []);

  return { aiState, statusMessage, setAIState };
}
