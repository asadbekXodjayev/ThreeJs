import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
  SMAAEffect,
  BlendFunction,
} from 'postprocessing';
import * as THREE from 'three';

// postprocessing only allows ONE convolution effect per EffectPass. Bloom,
// SMAA, and ChromaticAberration are all convolution effects, so each gets its
// own pass; the cheap non-convolution effects (vignette, grain) are merged.
export class Post {
  constructor(renderer, scene, camera, quality = 'high') {
    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType, // HDR bloom
    });
    this.composer.addPass(new RenderPass(scene, camera));

    if (quality !== 'low') {
      this.composer.addPass(new EffectPass(camera, new SMAAEffect()));
    }

    this.bloom = new BloomEffect({
      intensity: 1.15,
      luminanceThreshold: 0.22,
      luminanceSmoothing: 0.5,
      mipmapBlur: true,
      radius: 0.75,
    });
    this.composer.addPass(new EffectPass(camera, this.bloom));

    this.chroma = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0006, 0.0006),
      radialModulation: true,
      modulationOffset: 0.4,
    });
    this.composer.addPass(new EffectPass(camera, this.chroma));

    const tail = [new VignetteEffect({ offset: 0.28, darkness: 0.72 })];
    if (quality !== 'low') {
      tail.push(new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true }));
    }
    this.composer.addPass(new EffectPass(camera, ...tail));

    this.target = { ignite: 0 };
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
  }

  update() {
    // intensify chromatic aberration + bloom during the reckoning
    const ignite = this.target.ignite;
    this.chroma.offset.set(0.0006 + ignite * 0.0035, 0.0006 + ignite * 0.0035);
    this.bloom.intensity += (1.15 + ignite * 1.1 - this.bloom.intensity) * 0.05;
  }

  render(dt) {
    this.composer.render(dt);
  }

  dispose() {
    this.composer.dispose();
  }
}
