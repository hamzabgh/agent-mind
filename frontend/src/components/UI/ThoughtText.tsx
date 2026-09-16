import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { AIThought } from '@/types';

interface ThoughtTextProps {
  thought: AIThought | null;
  visible: boolean;
}

/**
 * Text as a secondary, cinematic layer — never a chat bubble. Floats in
 * lower-third, can be expanded for the full answer + sources.
 */
export function ThoughtText({ thought, visible }: ThoughtTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!thought) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={thought.query}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '19%',
            transform: 'translateX(-50%)',
            width: 'min(640px, 86vw)',
            textAlign: 'center',
            pointerEvents: 'auto',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(17px, 2.4vw, 26px)',
              fontWeight: 300,
              lineHeight: 1.5,
              color: '#f2f7f8',
              textShadow: '0 0 24px rgba(95,216,255,0.25)',
              margin: 0,
            }}
          >
            “{thought.insight}”
          </p>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                style={{ overflow: 'hidden' }}
              >
                <p
                  className="mono"
                  style={{
                    marginTop: 18,
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: 'rgba(238,244,246,0.68)',
                    fontWeight: 300,
                  }}
                >
                  {thought.fullText}
                </p>
                {thought.sources && (
                  <p
                    className="mono"
                    style={{ marginTop: 10, fontSize: 10, letterSpacing: '0.08em', color: 'rgba(95,216,255,0.55)' }}
                  >
                    SOURCE — {thought.sources.map((s) => s.title).join(' · ')}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="mono"
            style={{
              marginTop: 14,
              background: 'none',
              border: 'none',
              color: 'rgba(255,180,84,0.7)',
              fontSize: 10,
              letterSpacing: '0.14em',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            {expanded ? '— COLLAPSE' : '+ EXPAND'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
