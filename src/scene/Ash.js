import * as THREE from 'three';
import { ashVertex, ashFragment } from '../shaders/ash.glsl.js';

// A field of drifting ash/embers around the relic. One draw call (Points),
// all motion on the GPU.
export class Ash {
  constructor(count = 2600, pixelRatio = 1) {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // distribute in a tall cylindrical volume around the origin
      const r = 1.5 + Math.pow(Math.random(), 0.6) * 11;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.4 + Math.random() * 1.6;
      scales[i] = 0.4 + Math.random() * 1.8;
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: ashVertex,
      fragmentShader: ashFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 2.4 },
        uIgnite: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uAsh: { value: new THREE.Color('#5a5650') },
        uEmber: { value: new THREE.Color('#ff5a2a') },
        uGold: { value: new THREE.Color('#e8c46a') },
      },
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.target = { ignite: 0 };
  }

  addTo(scene) {
    scene.add(this.points);
    return this;
  }

  update(_dt, elapsed) {
    this.material.uniforms.uTime.value = elapsed;
    const u = this.material.uniforms.uIgnite;
    u.value += (this.target.ignite - u.value) * 0.06;
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
