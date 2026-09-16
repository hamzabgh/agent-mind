uniform float uTime;
uniform float uIntensity;
uniform float uAudio;
uniform vec3 uColorCore;
uniform vec3 uColorHot;
uniform vec3 uColorRim;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplacement;

void main() {
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.4);

  // energy banding traveling across the surface — "thought" moving through the core
  float bands = sin(vDisplacement * 14.0 - uTime * 3.0) * 0.5 + 0.5;

  vec3 base = mix(uColorCore, uColorHot, clamp(vDisplacement * 2.2 + 0.5, 0.0, 1.0));
  base = mix(base, uColorHot, bands * 0.25 * uIntensity);
  vec3 rim = uColorRim * fresnel * (1.4 + uAudio * 1.8);

  vec3 color = base * (0.55 + uIntensity * 0.6) + rim;

  float alpha = clamp(0.55 + fresnel * 0.6 + uAudio * 0.25, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
