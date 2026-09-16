uniform vec3 uColorCyan;
uniform vec3 uColorWarm;
uniform float uTime;

varying float vSeed;
varying float vHeightT;
varying float vGlow;
varying float vAlpha;

void main() {
  // a faint warm kiss right where the core sits, fading out fast so the
  // shoulders/neck stay clearly cyan and legible against the core's glow
  float warmth = smoothstep(0.05, -0.02, vHeightT);
  vec3 color = mix(uColorCyan, uColorWarm, warmth * 0.35);

  float flicker = 0.85 + 0.15 * sin(uTime * 3.0 + vSeed * 50.0);
  float alpha = vGlow * flicker * vAlpha * 0.75;

  gl_FragColor = vec4(color, alpha);
}
