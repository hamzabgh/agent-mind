uniform vec3 uColorCyan;
uniform vec3 uColorOrange;
uniform float uTime;

varying float vSeed;
varying float vDist;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float soft = pow(smoothstep(0.5, 0.0, d), 2.0);
  float mixAmt = clamp(1.0 - vDist / 6.0, 0.0, 1.0);
  vec3 color = mix(uColorCyan, uColorOrange, mixAmt * 0.6);
  float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + vSeed * 80.0);

  gl_FragColor = vec4(color, soft * 0.5 * twinkle);
}
