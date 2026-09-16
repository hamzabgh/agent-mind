import { motion } from 'framer-motion';
import type { AIState } from '@/types';

const COLOR: Record<AIState, string> = {
  IDLE: '#5fd8ff',
  LISTENING: '#5fd8ff',
  THINKING: '#ffb454',
  DEEP_THOUGHT: '#ffb454',
  SPEAKING: '#ff8a3d',
  EXCITED: '#ffd08a',
  CONNECTED: '#7fffb0',
  ERROR: '#ff5f6d',
};

interface StatusIndicatorProps {
  aiState: AIState;
  statusMessage?: string;
}

/** Small, quiet status readout — never a dashboard widget. */
export function StatusIndicator({ aiState, statusMessage }: StatusIndicatorProps) {
  return (
    <div
      className="mono"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        letterSpacing: '0.12em',
        color: 'rgba(238,244,246,0.55)',
      }}
    >
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: aiState === 'IDLE' ? 3 : 1, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: COLOR[aiState],
          boxShadow: `0 0 8px ${COLOR[aiState]}`,
          display: 'inline-block',
        }}
      />
      <span>{aiState.replace('_', ' ')}</span>
      {statusMessage && <span style={{ opacity: 0.6 }}>· {statusMessage}</span>}
    </div>
  );
}
