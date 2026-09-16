import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Scene } from '@/components/Scene';
import { MinimalHUD } from '@/components/UI/MinimalHUD';
import { StatusIndicator } from '@/components/UI/StatusIndicator';
import { ThoughtText } from '@/components/UI/ThoughtText';
import { TypeThought } from '@/components/UI/TypeThought';
import { MicrophoneControl } from '@/components/Voice/MicrophoneControl';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useSpeechOutput } from '@/hooks/useSpeechOutput';
import { useThoughtGraph } from '@/hooks/useThoughtGraph';
import { useAIState } from '@/hooks/useAIState';
import { store, useStore } from '@/state/store';
import { getQualityBudget } from '@/lib/perf';

/**
 * Orchestrates the full spec flow (section 19):
 * IDLE -> LISTENING -> THINKING ("connecting concepts…" / "forming
 * perspective…") -> concepts + connections appear -> SPEAKING -> IDLE,
 * with the new concepts folded permanently into the WORLD graph.
 */
export default function App() {
  const quality = useMemo(() => getQualityBudget(), []);
  const { aiState, statusMessage, setAIState } = useAIState();
  const thought = useStore((s) => s.currentThought);
  const thoughtVisible = useStore((s) => s.thoughtVisible);
  const view = useStore((s) => s.view);

  const busyRef = useRef(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useAudioAnalyzer();
  const { runThought } = useThoughtGraph();

  const { speak } = useSpeechOutput({
    onStart: () => setAIState('SPEAKING'),
    onEnd: () => {
      setAIState('IDLE');
      busyRef.current = false;
      fadeTimerRef.current = setTimeout(() => store.setState({ thoughtVisible: false }), 9000);
    },
  });

  const handleQuery = useCallback(
    async (text: string) => {
      if (!text || busyRef.current) return;
      busyRef.current = true;
      clearTimeout(fadeTimerRef.current);

      store.setState({
        conversation: [...store.getState().conversation, { id: crypto.randomUUID(), role: 'user', text, createdAt: Date.now() }],
      });

      // an excited tone (emphatic punctuation / shouting) gets a brief EXCITED
      // beat before settling into THINKING — a small nod to state 'EXCITED'.
      const excited = /!{1,}$/.test(text.trim()) || (text === text.toUpperCase() && text.length > 4);
      if (excited) {
        setAIState('EXCITED', 'that got its attention…');
        await new Promise((r) => setTimeout(r, 450));
      }

      setAIState('THINKING', 'connecting concepts…');
      const perspectiveTimer = setTimeout(() => {
        if (store.getState().aiState === 'THINKING' || store.getState().aiState === 'DEEP_THOUGHT') {
          setAIState(store.getState().aiState, 'forming perspective…');
        }
      }, 900);

      const thought = await runThought(text);
      clearTimeout(perspectiveTimer);

      // richer topics (more concepts to connect) read as deeper deliberation
      if (thought.concepts.length >= 5 && store.getState().aiState === 'THINKING') {
        setAIState('DEEP_THOUGHT', 'forming perspective…');
      }

      // let the concept nodes + connections visibly finish forming before speaking
      await new Promise((r) => setTimeout(r, 1500));

      store.setState({
        thoughtVisible: true,
        thoughtExpanded: false,
        conversation: [
          ...store.getState().conversation,
          { id: crypto.randomUUID(), role: 'ai', text: thought.insight, createdAt: Date.now() },
        ],
      });

      speak(thought.insight);
    },
    [runThought, setAIState, speak],
  );

  const voice = useVoiceInput({
    onStart: () => setAIState('LISTENING'),
    onFinalTranscript: (text) => {
      store.setState({ transcript: text, interimTranscript: '' });
      handleQuery(text);
    },
    onInterimTranscript: (text) => store.setState({ interimTranscript: text }),
    onEnd: () => {
      // If nothing was captured, drift back to idle rather than sticking on LISTENING.
      if (store.getState().aiState === 'LISTENING') setAIState('IDLE');
    },
    onError: (message) => {
      setAIState('ERROR', message);
      setTimeout(() => setAIState('IDLE'), 2200);
    },
  });

  const handleMicPress = useCallback(() => {
    if (aiState === 'SPEAKING') {
      // barge-in: interrupt the AI and start listening immediately
      window.speechSynthesis?.cancel();
      busyRef.current = false;
      voice.start();
      return;
    }
    if (aiState === 'LISTENING') {
      voice.stop();
      return;
    }
    if (aiState === 'IDLE' || aiState === 'ERROR' || aiState === 'CONNECTED') {
      voice.start();
    }
  }, [aiState, voice]);

  useEffect(() => {
    return () => clearTimeout(fadeTimerRef.current);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#030405' }}>
      <Scene quality={quality} />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <MinimalHUD
          view={view}
          onNavigate={(v) => {
            store.setState({ view: v });
            if (v === 'WORLD' && store.getState().aiState === 'IDLE') {
              setAIState('CONNECTED', 'entering the world graph…');
              setTimeout(() => {
                if (store.getState().aiState === 'CONNECTED') setAIState('IDLE');
              }, 1600);
            }
          }}
        />

        <ThoughtText thought={thought} visible={thoughtVisible} />

        <div
          style={{
            position: 'absolute',
            bottom: 22,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            pointerEvents: 'auto',
          }}
        >
          <MicrophoneControl aiState={aiState} onPress={handleMicPress} />
          <TypeThought onSubmit={handleQuery} disabled={aiState === 'THINKING' || aiState === 'DEEP_THOUGHT'} />
        </div>

        <div style={{ position: 'absolute', bottom: 26, right: 28, pointerEvents: 'none' }}>
          <StatusIndicator aiState={aiState} statusMessage={statusMessage} />
        </div>

        {!voice.supported && (
          <div
            className="mono"
            style={{
              position: 'absolute',
              bottom: 26,
              left: 28,
              fontSize: 10,
              letterSpacing: '0.08em',
              color: 'rgba(255,180,84,0.55)',
              maxWidth: 220,
            }}
          >
            Speech recognition isn't supported here — try Chrome, or type a thought instead.
          </div>
        )}
      </div>

      <div className="vignette" />
      <div className="grain" />
    </div>
  );
}
