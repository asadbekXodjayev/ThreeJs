// Drifting ash / embers. Points rise slowly and recycle; their colour shifts
// from cold ash to live ember near the relic and as ignite climbs.
export const ashVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uIgnite;
uniform float uPixelRatio;

attribute float aSpeed;
attribute float aScale;
attribute float aSeed;

varying float vGlow;
varying float vSeed;

void main(){
  vec3 p = position;

  // slow upward drift with a lazy horizontal sway, wrapped in a tall column
  float life = mod(uTime * aSpeed * 0.35 + aSeed * 40.0, 40.0);
  p.y += life;
  p.x += sin(uTime * 0.2 * aSpeed + aSeed * 6.28) * 0.6;
  p.z += cos(uTime * 0.15 * aSpeed + aSeed * 6.28) * 0.6;
  p.y = mod(p.y + 20.0, 40.0) - 20.0; // wrap into [-20, 20]

  vec4 mv = modelViewMatrix * vec4(p, 1.0);

  // embers near the core glow hotter; fade with distance
  float dist = length(p);
  vGlow = smoothstep(9.0, 1.5, dist) * (0.4 + uIgnite);
  vSeed = aSeed;

  gl_PointSize = uSize * aScale * uPixelRatio * (30.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const ashFragment = /* glsl */ `
uniform vec3 uAsh;
uniform vec3 uEmber;
uniform vec3 uGold;

varying float vGlow;
varying float vSeed;

void main(){
  // soft round sprite
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.0, d);
  if (alpha < 0.01) discard;

  vec3 col = mix(uAsh, uEmber, vGlow);
  col = mix(col, uGold, vGlow * vGlow * 0.6);

  // tiny twinkle so the field feels alive
  float tw = 0.7 + 0.3 * sin(vSeed * 100.0);
  gl_FragColor = vec4(col * tw, alpha * (0.25 + vGlow * 0.9));
}
`;
