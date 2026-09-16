import { useCallback, useRef, useState } from 'react';
import { audioEngine } from '@/lib/audioEngine';

interface UseVoiceInputOptions {
  onFinalTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

/**
 * Wraps getUserMedia (for the audio-reactive visuals) + the Web Speech
 * SpeechRecognition API (for the transcript) behind one `start`/`stop` pair.
 *
 * This is the "prototype" transport. Swapping to a realtime voice model
 * later means replacing the body of `start`/`stop` — nothing in the visual
 * layer depends on how the transcript or audio arrived.
 */
export function useVoiceInput({ onFinalTranscript, onInterimTranscript, onStart, onEnd, onError }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(
    () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  );
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(async () => {
    const micOk = await audioEngine.connectMicrophone();
    if (!micOk) {
      onError?.('Microphone unavailable — check browser permissions.');
      return;
    }

    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      // Visuals still work from raw mic input even without a transcript engine.
      onError?.('Speech recognition not supported in this browser — try Chrome.');
      setIsListening(true);
      onStart?.();
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      onStart?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (interim) onInterimTranscript?.(interim);
      if (finalText) onFinalTranscript(finalText.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      onError?.(`Listening error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
      audioEngine.disconnectMicrophone();
      onEnd?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onFinalTranscript, onInterimTranscript, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  return { start, stop, isListening, supported };
}
