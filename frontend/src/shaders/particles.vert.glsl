// Ambient particle swarm (ParticleField) — ember/data-dust orbiting the
// entity. Separate from NeuralFace: these have no target shape, only
// state-driven orbital behavior (idle drift, pull-in on LISTENING, circulate
// on THINKING, blow outward on SPEAKING).
attribute float aSeed;
attribute float aRadius;
attribute float aSpeed;
attribute float aHeight;

uniform float uTime;
uniform float uInward;    // 0..1, pulls particles toward the core (LISTENING)
uniform float uCirculate; // 0..1, extra orbital speed (THINKING)
uniform float uAudio;
uniform float uPixelRatio;

varying float vSeed;
varying float vDist;

void main() {
  vSeed = aSeed;

  float angle = uTime * aSpeed * (1.0 + uCirculate * 1.8) + aSeed * 62.8;
  float radius = mix(aRadius, aRadius * 0.35, uInward) - uAudio * 0.4;
  radius = max(radius, 0.6);

  float bob = sin(uTime * 0.5 + aSeed * 30.0) * 0.25 * aHeight;
  vec3 pos = vec3(cos(angle) * radius, aHeight * 1.6 + bob, sin(angle) * radius);

  vDist = radius;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float size = (1.1 + aSeed * 1.6) * (1.0 + uAudio * 1.2);
  // small focal constant — see neuralFace.vert.glsl for why this must stay small.
  gl_PointSize = size * uPixelRatio * (10.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
