// NeuralBust — the featureless head+neck+shoulders wireframe: fine
// horizontal contour rings that stay clearly readable as a silhouette at
// all times (unlike the old face particles, cohesion here never drops far),
// while still breathing/flowing so it never looks like a static CAD model.
attribute float aSeed;
attribute float aHeightT; // 0 at shoulders, 1 at crown

uniform float uTime;
uniform float uAudio;
uniform float uBoot;     // 0..1 assembly progress since mount
uniform float uActivity; // 0..1 overall liveliness (state-driven)

varying float vSeed;
varying float vHeightT;
varying float vGlow;
varying float vAlpha;

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main() {
  vSeed = aSeed;
  vHeightT = aHeightT;

  vec3 p = position;
  vec3 dir = normalize(vec3(p.x, 0.0, p.z) + 0.0001);

  // gentle "breathing" — the whole silhouette swells/contracts slightly
  float breathe = sin(uTime * 0.55 + aHeightT * 3.0) * 0.012;
  // small live flow, kept subtle so the contour stays legible as a head
  float flow = snoise(p * 1.1 + uTime * 0.12) * (0.02 + uActivity * 0.035);
  float audioPush = uAudio * 0.05 * (1.0 - aHeightT * 0.6);

  vec3 settled = p + dir * (breathe + flow + audioPush);

  // boot-in: rings fly inward from a scattered radius, converging on mount
  vec3 scattered = p + dir * (1.0 - uBoot) * (2.2 + aSeed * 2.0);
  scattered.y += (1.0 - uBoot) * (aSeed - 0.5) * 3.0;

  vec3 finalPos = mix(scattered, settled, uBoot);

  // brightness/flicker intensity (audio + state driven) — applies everywhere
  vGlow = 0.7 + uActivity * 0.3 + uAudio * 0.5;

  // fade only the very top of the crown so it reads as dissolving into data
  // rather than a hard rim (paired with a few loose particles in JS).
  vAlpha = 1.0 - smoothstep(0.93, 1.0, aHeightT);

  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
