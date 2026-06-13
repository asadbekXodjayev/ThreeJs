import { simplex3d } from './noise.glsl.js';

// The relic: a slowly churning obsidian solid. The vertex stage displaces the
// surface along its normal with layered noise (a living, breathing stone).
// The fragment stage paints near-black rock with a fresnel rim that glows from
// blood-red at grazing angles to molten gold, plus an inner "furnace" that
// opens up as uIgnite rises (driven by scroll).
export const relicVertex = /* glsl */ `
${simplex3d}

uniform float uTime;
uniform float uDisplace;   // surface turbulence amount
uniform float uFracture;   // pushes shards outward
uniform float uIgnite;     // 0..1 reckoning energy

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;
varying float vDispl;

void main(){
  vec3 pos = position;

  // domain-warped fbm so the surface roils rather than ripples uniformly
  float t = uTime * 0.18;
  vec3 q = pos * 1.3 + vec3(0.0, t, 0.0);
  float n = fbm(q + fbm(q + t) * 0.6);
  vNoise = n;

  // breathing + ignite-driven swell
  float swell = 0.04 + uIgnite * 0.12;
  float displ = n * (uDisplace + uIgnite * 0.6) + swell * sin(uTime * 0.8);
  vDispl = displ;

  // fracture: shove vertices outward along the normal in chunky bands
  float band = step(0.0, sin(n * 8.0 + uTime));
  pos += normal * (displ + uFracture * band * 0.9);

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const relicFragment = /* glsl */ `
uniform float uTime;
uniform float uIgnite;
uniform vec3 uRock;
uniform vec3 uEmber;
uniform vec3 uGold;
uniform vec3 uBlood;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise;
varying float vDispl;

void main(){
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);

  // fresnel — bright at grazing angles
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

  // base obsidian, slightly varied by the displacement noise
  vec3 col = uRock * (0.35 + 0.4 * smoothstep(-0.4, 0.6, vNoise));

  // rim: blood -> ember -> gold as fresnel climbs
  vec3 rim = mix(uBlood, uEmber, smoothstep(0.2, 0.6, fres));
  rim = mix(rim, uGold, smoothstep(0.6, 1.0, fres));
  col += rim * fres * (1.2 + uIgnite * 1.6);

  // inner furnace: cracks where the surface stretched most, opening with ignite
  float crack = smoothstep(0.18, 0.42, vDispl);
  vec3 furnace = mix(uBlood, uGold, 0.5 + 0.5 * sin(uTime * 1.5 + vNoise * 6.0));
  col += furnace * crack * uIgnite * 2.4;

  // faint cool counter-light so the dark side isn't pure black
  col += vec3(0.04, 0.05, 0.07) * (1.0 - fres);

  // subtle pulse
  col *= 0.9 + 0.1 * sin(uTime * 0.6);

  gl_FragColor = vec4(col, 1.0);
}
`;
