# Hamza Boughanim — Digital Consciousness Interface

> "AI is not a chat window. AI is a digital consciousness."

A portfolio interface built around one idea: **FACE → MIND → WORLD**. The
Face is the AI's physical presence (a particle-built head with a living
orange "Intelligence Core"). The Mind is its conceptual space (the concepts
in a question, visualized as nodes and connections before any text
appears). The World is its persistent memory (every concept ever surfaced,
kept as an explorable knowledge graph). No chat bubbles, no dashboard, no
sidebar — the entity itself is the interface.

This repo is the **first prototype** per the brief's own priority order: a
polished, fully interactive frontend with mocked AI responses, built so a
real backend (RAG, memory, a real LLM) drops in without touching the visual
layer. See `backend/README.md` for that half.

## Quick start (frontend)

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL in **Chrome** (Web Speech API — both
recognition and synthesis — is most complete there; other browsers fall
back to text input automatically, see "Browser support" below).

1. The entity appears, breathing at IDLE.
2. Press the **🎙 TALK** button (or type via "TYPE A THOUGHT") and ask
   something — try *"Can AI become conscious?"* or *"How could AI change
   human creativity?"*.
3. Watch LISTENING → THINKING (concepts appear, connections form) →
   SPEAKING, with the whole entity and environment reacting to voice
   energy, not just a mouth or a waveform.
4. Use the **WORK** / **EXPLORE** nav to pull the camera back into the
   WORLD view — every concept from the conversation lives there
   permanently, alongside Hamza's own project graph.

`npm run build` produces a static `dist/` deployable to Vercel, Cloudflare
Pages, or the nginx setup in `docker-compose.yml`.

## Project structure

```
frontend/src/
  components/
    AIEntity/   — FACE: NeuralFace (particle head), EnergyCore (the
                  Intelligence Core), ParticleField, NeuralLines
    Mind/       — MIND: ConceptNode, ThoughtNodes, ConnectionLines,
                  KnowledgeGraph
    World/      — WORLD: DigitalTerrain, ParticleLandscape, NeuralEnvironment
    Voice/      — MicrophoneControl, VoiceVisualizer
    UI/         — MinimalHUD, StatusIndicator, ThoughtText, TypeThought
  hooks/        — useAudioAnalyzer, useVoiceInput, useSpeechOutput,
                  useAIState, useThoughtGraph
  state/store.ts — hand-rolled observable store (see file header for why
                   not Redux/Zustand: the render loop reads it every frame
                   outside React, UI subscribes selectively)
  lib/          — mockAI.ts (the one file a backend integration replaces),
                  generateFace.ts (procedural head geometry), stateMotion.ts
                  (the state-machine → visual-target mapping), audioEngine.ts
  shaders/      — hand-written GLSL for the core, face particles, ambient
                  particles, and terrain

backend/        — FastAPI skeleton; see backend/README.md
docker-compose.yml, nginx.conf.example — self-hosted deployment
```

## The state machine

Eight states (`IDLE, LISTENING, THINKING, SPEAKING, EXCITED, DEEP_THOUGHT,
CONNECTED, ERROR`), each mapped to a full set of visual targets in
`lib/stateMotion.ts` — core intensity/turbulence, face cohesion, particle
behavior, neural-line activity, environment energy. Every visual component
eases toward the *same* targets independently, so states stay consistent
across Face/Core/Environment without duplicating the mapping five times.
`App.tsx` drives real transitions through the conversation flow; `EXCITED`
triggers on emphatic input, `DEEP_THOUGHT` on richer topics, `CONNECTED`
briefly on entering the WORLD view.

## Swapping in a real AI backend

`frontend/src/lib/mockAI.ts` exports one function: `think(query, turnIndex)
=> Promise<AIThought>`. Nothing else in the frontend imports it except
`hooks/useThoughtGraph.ts`. To go live:

```ts
// lib/mockAI.ts becomes a thin fetch wrapper:
export async function think(query: string, turnIndex: number) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, turn_index: turnIndex }),
  });
  return res.json(); // shape matches ChatResponse in backend/app/models/schemas.py
}
```

Same story for voice: `hooks/useSpeechOutput.ts` and
`hooks/useVoiceInput.ts` isolate the browser Web Speech APIs behind
`speak()`/`start()`/`stop()`. Swapping to OpenAI's Realtime API (or
similar) means rewriting the *inside* of those two hooks and feeding real
PCM audio into `lib/audioEngine.ts` instead of `enterSyntheticMode()` — the
entire visual system already only consumes `AudioBands` numbers and has no
idea whether they came from a microphone, a TTS boundary event, or a real
model's audio stream.

## Known limitations / honest next steps

- **Bundle size**: the production JS is ~1.3MB (~390KB gzipped), almost
  entirely three.js + postprocessing. Fine for a prototype; code-splitting
  the Mind/World layers behind `React.lazy` would help a real launch.
- **Performance scaling**: `lib/perf.ts` picks a static particle/quality
  budget once at boot (mobile vs. desktop). There's no live FPS governor —
  a real next step is sampling frame time and stepping particle counts
  down if a device can't sustain 60fps.
- **Camera**: state transitions drive the camera directly (see
  `Scene.tsx`'s `CameraRig`), and OrbitControls sits on top for a small
  amount of user rotation/zoom that gently springs back to the current
  framing. This is intentional — the entity is the interface, not a 3D
  model to manually navigate — but it means the camera never stays where a
  user drags it for long.
- **SpeechSynthesis has no audio-buffer access**: browsers don't expose the
  raw audio a `SpeechSynthesisUtterance` produces, so `audioEngine.ts`
  approximates "speaking energy" from word-boundary timing rather than a
  real frequency spectrum (see that file's header comment). A realtime
  voice API fixes this for free since it streams real audio.
- **Backend is an interface, not a product**: see `backend/README.md`'s
  "honest" framing — mock providers throughout, real ones are
  `NotImplementedError` stubs with the integration points clearly marked.

## Browser support

Voice input needs `SpeechRecognition` (Chrome/Edge; Safari has partial
support, Firefox none). The interface detects this and falls back to
"TYPE A THOUGHT" automatically — the visual system (Face/Core/World)
works identically either way, since it never distinguishes voice from
typed input past the transcript stage.
