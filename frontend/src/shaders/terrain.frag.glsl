uniform vec3 uColorDeep;
uniform vec3 uColorLine;
uniform float uTime;
uniform float uEnergy;

varying float vHeight;
varying float vDist;

void main() {
  // grazing-angle contours alias badly at distance, so both the band
  // frequency and the visible range are kept modest rather than sharp.
  float contour = abs(fract(vHeight * 3.2 - uTime * 0.05) - 0.5);
  float line = smoothstep(0.4, 0.5, contour);
  line = 1.0 - line; // thin bright bands

  vec3 color = mix(uColorDeep, uColorLine, line * (0.4 + uEnergy * 0.5));
  color += uColorLine * max(0.0, vHeight) * 0.5;

  float edgeFade = smoothstep(7.0, 1.5, vDist);
  float alpha = (0.16 + line * 0.2 * (0.3 + uEnergy)) * edgeFade;

  gl_FragColor = vec4(color, alpha);
}
