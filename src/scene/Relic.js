import * as THREE from 'three';
import { relicVertex, relicFragment } from '../shaders/relic.glsl.js';

const COL = {
  rock: new THREE.Color('#15131a'),
  ember: new THREE.Color('#ff3a1d'),
  gold: new THREE.Color('#d8b15a'),
  blood: new THREE.Color('#9a1119'),
};

// The hero object. A high-subdivision icosahedron driven entirely by a
// custom ShaderMaterial — no textures, no GLB, nothing to fail to load.
export class Relic {
  constructor(quality = 'high') {
    const detail = quality === 'low' ? 32 : quality === 'mid' ? 64 : 128;
    const geometry = new THREE.IcosahedronGeometry(2.2, detail);

    this.material = new THREE.ShaderMaterial({
      vertexShader: relicVertex,
      fragmentShader: relicFragment,
      uniforms: {
        uTime: { value: 0 },
        uDisplace: { value: 0.16 },
        uFracture: { value: 0 },
        uIgnite: { value: 0 },
        uRock: { value: COL.rock },
        uEmber: { value: COL.ember },
        uGold: { value: COL.gold },
        uBlood: { value: COL.blood },
      },
    });

    this.mesh = new THREE.Mesh(geometry, this.material);

    // a thin glowing core sphere read through the cracks
    const coreMat = new THREE.MeshBasicMaterial({
      color: COL.ember,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 6), coreMat);
    this.coreMat = coreMat;

    this.group = new THREE.Group();
    this.group.add(this.mesh, this.core);

    // exposed scroll-driven targets (lerped in update for buttery motion)
    this.target = { ignite: 0, fracture: 0, displace: 0.16, spin: 0.08 };
    this._spin = 0.08;
  }

  addTo(scene) {
    scene.add(this.group);
    return this;
  }

  update(dt, elapsed) {
    const u = this.material.uniforms;
    u.uTime.value = elapsed;

    // ease uniforms toward scroll targets
    u.uIgnite.value += (this.target.ignite - u.uIgnite.value) * 0.06;
    u.uFracture.value += (this.target.fracture - u.uFracture.value) * 0.06;
    u.uDisplace.value += (this.target.displace - u.uDisplace.value) * 0.06;
    this._spin += (this.target.spin - this._spin) * 0.04;

    this.coreMat.opacity = u.uIgnite.value * 0.5;
    this.core.scale.setScalar(1 + u.uIgnite.value * 0.15);

    this.group.rotation.y += dt * this._spin;
    this.group.rotation.x += dt * this._spin * 0.35;
  }

  // soft parallax toward the pointer
  lookToward(px, py) {
    this.group.rotation.z += (px * 0.12 - this.group.rotation.z) * 0.04;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.core.geometry.dispose();
    this.coreMat.dispose();
  }
}
