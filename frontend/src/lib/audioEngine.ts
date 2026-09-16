/**
 * Central Web Audio analysis engine.
 *
 * Two producers feed the same consumer:
 *  1. The microphone, while LISTENING (real audio via getUserMedia).
 *  2. A synthetic envelope, while SPEAKING (see hooks/useSpeechOutput.ts) —
 *     the SpeechSynthesis API does not expose its generated audio buffer in
 *     any browser today, so we approximate "speech energy" from utterance
 *     boundary events. Swap this producer for a real MediaStreamAudioSourceNode
 *     once the backend serves actual audio (e.g. OpenAI Realtime API) — the
 *     rest of the visual system (Face/Core/Environment) already only cares
 *     about the AudioBands numbers below and does not know the difference.
 */
import type { AudioBands } from '@/types';

const EMPTY: AudioBands = { amplitude: 0, rms: 0, bass: 0, mid: 0, high: 0 };

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // synthetic envelope state (driven by speech boundary events)
  private synthetic = 0;
  private syntheticTarget = 0;
  private useSynthetic = false;

  private bands: AudioBands = { ...EMPTY };
  private smoothed: AudioBands = { ...EMPTY };

  private ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.75;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);
    }
    return this.ctx;
  }

  async connectMicrophone(): Promise<boolean> {
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') await ctx.resume();
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      this.micSource = ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser!);
      this.useSynthetic = false;
      return true;
    } catch (err) {
      console.warn('[audioEngine] microphone unavailable', err);
      return false;
    }
  }

  disconnectMicrophone() {
    this.micSource?.disconnect();
    this.micSource = null;
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = null;
  }

  /** Switch to the synthetic (speech-boundary-driven) envelope. */
  enterSyntheticMode() {
    this.useSynthetic = true;
    this.synthetic = 0;
    this.syntheticTarget = 0;
  }

  exitSyntheticMode() {
    this.useSynthetic = false;
    this.synthetic = 0;
    this.syntheticTarget = 0;
  }

  /** Called by useSpeechOutput on each TTS word boundary. intensity 0..1 */
  pulseSynthetic(intensity: number) {
    this.syntheticTarget = Math.min(1, intensity);
  }

  /** Call once per animation frame. Returns smoothed, normalized bands. */
  update(dt: number): AudioBands {
    if (this.useSynthetic) {
      // decay target, ease current value toward it — feels like a voice, not a metronome
      this.syntheticTarget *= Math.exp(-dt * 3.2);
      this.synthetic += (this.syntheticTarget - this.synthetic) * Math.min(1, dt * 10);
      const n = Math.max(0, this.synthetic);
      this.bands = {
        amplitude: n,
        rms: n * 0.9,
        bass: n * (0.55 + 0.2 * Math.sin(performance.now() * 0.004)),
        mid: n,
        high: n * (0.5 + 0.3 * Math.cos(performance.now() * 0.006)),
      };
    } else if (this.analyser && this.freqData && this.timeData) {
      this.analyser.getByteFrequencyData(this.freqData as any);
      this.analyser.getByteTimeDomainData(this.timeData as any);

      let sumSq = 0;
      for (let i = 0; i < this.timeData.length; i++) {
        const v = (this.timeData[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / this.timeData.length);

      const n = this.freqData.length;
      const bassEnd = Math.floor(n * 0.12);
      const midEnd = Math.floor(n * 0.5);
      const band = (from: number, to: number) => {
        let s = 0;
        for (let i = from; i < to; i++) s += this.freqData![i];
        return s / Math.max(1, to - from) / 255;
      };

      this.bands = {
        amplitude: Math.min(1, rms * 3.2),
        rms: Math.min(1, rms * 3.2),
        bass: band(0, bassEnd),
        mid: band(bassEnd, midEnd),
        high: band(midEnd, n),
      };
    } else {
      this.bands = { ...EMPTY };
    }

    const a = 1 - Math.exp(-dt * 8);
    this.smoothed = {
      amplitude: this.smoothed.amplitude + (this.bands.amplitude - this.smoothed.amplitude) * a,
      rms: this.smoothed.rms + (this.bands.rms - this.smoothed.rms) * a,
      bass: this.smoothed.bass + (this.bands.bass - this.smoothed.bass) * a,
      mid: this.smoothed.mid + (this.bands.mid - this.smoothed.mid) * a,
      high: this.smoothed.high + (this.bands.high - this.smoothed.high) * a,
    };

    return this.smoothed;
  }

  getBands() {
    return this.smoothed;
  }
}

export const audioEngine = new AudioEngine();
