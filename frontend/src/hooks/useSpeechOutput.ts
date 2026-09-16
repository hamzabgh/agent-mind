import { useCallback, useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audioEngine';

interface UseSpeechOutputOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onWordBoundary?: (charIndex: number) => void;
}

/**
 * Text-to-speech via SpeechSynthesis, wired into the audio engine's
 * "synthetic" envelope so the Face/Core/Environment react to the AI's own
 * voice the same way they'd react to a real audio stream.
 *
 * ARCHITECTURE NOTE: this is the one piece explicitly designed to be
 * swapped out. Replace `speak()` with a call to a realtime voice model
 * (e.g. OpenAI Realtime API) that streams actual PCM audio, feed that
 * stream into audioEngine via a MediaStreamAudioSourceNode instead of
 * enterSyntheticMode(), and every visual consumer keeps working unchanged.
 */
export function useSpeechOutput({ onStart, onEnd, onWordBoundary }: UseSpeechOutputOptions = {}) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const pick = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      // Prefer a calm, lower-pitched English voice if available — purely aesthetic.
      voiceRef.current =
        voices.find((v) => /en-(US|GB)/.test(v.lang) && /male|daniel|david|fred/i.test(v.name)) ??
        voices.find((v) => /en-(US|GB)/.test(v.lang)) ??
        voices[0] ??
        null;
    };
    pick();
    window.speechSynthesis?.addEventListener('voiceschanged', pick);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', pick);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) {
        // No TTS support: fake a reasonable duration so the visual pipeline still runs.
        onStart?.();
        audioEngine.enterSyntheticMode();
        const duration = Math.max(1200, text.length * 45);
        const start = performance.now();
        const iv = setInterval(() => {
          audioEngine.pulseSynthetic(0.4 + Math.random() * 0.5);
          if (performance.now() - start > duration) {
            clearInterval(iv);
            audioEngine.exitSyntheticMode();
            onEnd?.();
          }
        }, 90);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      utterance.pitch = 0.92;
      utterance.volume = 1;
      if (voiceRef.current) utterance.voice = voiceRef.current;

      utterance.onstart = () => {
        audioEngine.enterSyntheticMode();
        onStart?.();
      };

      utterance.onboundary = (e) => {
        // Word-length-proportional pulse reads as natural speech emphasis.
        const nextSpace = text.indexOf(' ', e.charIndex + 1);
        const wordLen = (nextSpace === -1 ? text.length : nextSpace) - e.charIndex;
        audioEngine.pulseSynthetic(0.45 + Math.min(0.55, wordLen / 10));
        onWordBoundary?.(e.charIndex);
      };

      utterance.onend = () => {
        audioEngine.exitSyntheticMode();
        onEnd?.();
      };

      utterance.onerror = () => {
        audioEngine.exitSyntheticMode();
        onEnd?.();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [onStart, onEnd, onWordBoundary],
  );

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    audioEngine.exitSyntheticMode();
  }, []);

  return { speak, cancel };
}
