uniform vec3 uColorCyan;
uniform vec3 uColorOrange;
uniform float uTime;

varying float vSeed;
varying float vRegion;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.5, 0.0, d);
  float soft = pow(core, 1.8);

  vec3 color = mix(uColorCyan, uColorOrange, clamp(vRegion * 0.35 + vGlow * 0.3, 0.0, 1.0));
  float flicker = 0.85 + 0.15 * sin(uTime * 4.0 + vSeed * 40.0);

  float alpha = soft * (0.55 + vGlow * 0.6) * flicker;
  gl_FragColor = vec4(color, alpha);
}
