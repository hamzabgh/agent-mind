import { motion } from 'framer-motion';
import { VoiceVisualizer } from './VoiceVisualizer';
import type { AIState } from '@/types';

interface MicrophoneControlProps {
  aiState: AIState;
  onPress: () => void;
  disabled?: boolean;
}

const LABEL: Partial<Record<AIState, string>> = {
  IDLE: 'TALK',
  LISTENING: 'LISTENING…',
  THINKING: 'THINKING…',
  SPEAKING: 'SPEAKING…',
};

/**
 * The primary interaction surface. Not a recording-app mic button — a
 * single glyph that the AI's own state animates around, per spec: "the AI
 * itself should communicate that it is listening."
 */
export function MicrophoneControl({ aiState, onPress, disabled }: MicrophoneControlProps) {
  const listening = aiState === 'LISTENING';
  const busy = aiState === 'THINKING' || aiState === 'DEEP_THOUGHT';

  return (
    <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <VoiceVisualizer active={listening} />
      <motion.button
        onClick={onPress}
        disabled={disabled || busy}
        aria-label={LABEL[aiState] ?? 'TALK'}
        animate={{
          scale: listening ? [1, 1.06, 1] : 1,
          boxShadow: listening
            ? '0 0 40px rgba(95,216,255,0.55)'
            : aiState === 'SPEAKING'
              ? '0 0 40px rgba(255,138,61,0.5)'
              : '0 0 18px rgba(255,138,61,0.18)',
        }}
        transition={{ duration: listening ? 1.6 : 0.4, repeat: listening ? Infinity : 0, ease: 'easeInOut' }}
        style={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          border: '1px solid rgba(255,180,84,0.35)',
          background: 'radial-gradient(circle at 35% 30%, rgba(255,208,138,0.25), rgba(10,6,2,0.7))',
          color: '#ffe1a8',
          fontSize: 20,
          cursor: busy || disabled ? 'default' : 'pointer',
          opacity: busy ? 0.5 : 1,
          backdropFilter: 'blur(6px)',
        }}
      >
        {listening ? '●' : busy ? '…' : '🎙'}
      </motion.button>
    </div>
  );
}
