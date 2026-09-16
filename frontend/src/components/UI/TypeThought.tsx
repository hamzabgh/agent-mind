import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TypeThoughtProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

/**
 * Secondary interaction. Deliberately not a chat input bar — a single
 * line that appears only when asked for, and disappears again.
 */
export function TypeThought({ onSubmit, disabled }: TypeThoughtProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue('');
    setOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'min(420px, 70vw)' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.35 }}
            style={{ overflow: 'hidden' }}
          >
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              onBlur={() => !value && setOpen(false)}
              placeholder="type a thought…"
              className="mono"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(95,216,255,0.25)',
                borderRadius: 999,
                padding: '10px 18px',
                color: '#eef4f6',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="mono"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(238,244,246,0.4)',
          fontSize: 10,
          letterSpacing: '0.14em',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {open ? 'CANCEL' : 'TYPE A THOUGHT'}
      </button>
    </div>
  );
}
