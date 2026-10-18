/**
 * Anchor.js - Ancient Shrine Checkpoints
 * Ancient weathered stone pillar with a runic brazier that ignites with
 * warm golden flame and rising embers upon activation, creating a safe sanctuary.
 */

import * as THREE from 'three';
import { audioManager } from '../game/AudioManager.js';

export class Anchor {
  constructor(id, position, chapterId) {
    this.id = id;
    this.chapterId = chapterId;
    this.isActivated = false;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = `Anchor_${id}`;

    // Mesh elements
    this.flameCore = null;
    this.flameLight = null;
    this.embersParticle = null;
    this.emberPositions = null;
    this.sanctuaryRadius = 6.0;

    this.animTime = 0;

    this.buildMesh();
  }

  buildMesh() {
    // 1. Weathered Stone Plinth
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x222a35,
      roughness: 0.85,
      metalness: 0.1
    });

    const baseGeom = new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8);
    const baseMesh = new THREE.Mesh(baseGeom, stoneMat);
    baseMesh.position.y = 0.2;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    const pillarGeom = new THREE.CylinderGeometry(0.4, 0.55, 1.4, 8);
    const pillarMesh = new THREE.Mesh(pillarGeom, stoneMat);
    pillarMesh.position.y = 1.0;
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    this.group.add(pillarMesh);

    // 2. Iron Brazier Bowl
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.4,
      metalness: 0.8
    });
    const bowlGeom = new THREE.CylinderGeometry(0.55, 0.35, 0.3, 8);
    const bowlMesh = new THREE.Mesh(bowlGeom, ironMat);
    bowlMesh.position.y = 1.8;
    this.group.add(bowlMesh);

    // 3. Flame Core (hidden/dim until activated)
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.2
    });
    const flameGeom = new THREE.SphereGeometry(0.25, 8, 8);
    this.flameCore = new THREE.Mesh(flameGeom, flameMat);
    this.flameCore.position.y = 2.05;
    this.group.add(this.flameCore);

    // 4. Warm Point Light
    this.flameLight = new THREE.PointLight(0xff9922, 0.3, 3.0);
    this.flameLight.position.set(0, 2.1, 0);
    this.group.add(this.flameLight);

    // 5. Rising Ember Particles
    const emberCount = 35;
    const emberGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    this.emberVelocities = [];

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = Math.random() * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      this.emberVelocities.push({
        x: (Math.random() - 0.5) * 0.1,
        y: 0.3 + Math.random() * 0.4,
        z: (Math.random() - 0.5) * 0.1
      });
    }

    emberGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.emberPositions = positions;

    const emberMat = new THREE.PointsMaterial({
      color: 0xffb84d,
      size: 0.08,
      transparent: true,
      opacity: 0.0
    });

    this.embersParticle = new THREE.Points(emberGeom, emberMat);
    this.embersParticle.position.y = 1.9;
    this.group.add(this.embersParticle);
  }

  activate() {
    if (this.isActivated) return false;
    this.isActivated = true;

    // Flare up flame and light
    this.flameCore.material.opacity = 0.95;
    this.flameCore.material.color.setHex(0xffbb33);
    this.flameLight.intensity = 4.5;
    this.flameLight.distance = 14.0;
    this.flameLight.color.setHex(0xffaa33);
    this.embersParticle.material.opacity = 0.85;

    audioManager.playAnchorActivation();
    return true;
  }

  setActivatedSilently() {
    this.isActivated = true;
    this.flameCore.material.opacity = 0.95;
    this.flameCore.material.color.setHex(0xffbb33);
    this.flameLight.intensity = 3.5;
    this.flameLight.distance = 12.0;
    this.embersParticle.material.opacity = 0.85;
  }

  update(delta) {
    this.animTime += delta;

    if (this.isActivated) {
      // Flame flickering
      const flicker = Math.sin(this.animTime * 12) * 0.2 + Math.cos(this.animTime * 19) * 0.15;
      this.flameLight.intensity = 3.8 + flicker;
      this.flameCore.scale.setScalar(1.0 + flicker * 0.1);

      // Embers rising animation
      const posAttr = this.embersParticle.geometry.attributes.position;
      for (let i = 0; i < this.emberVelocities.length; i++) {
        let y = posAttr.getY(i) + this.emberVelocities[i].y * delta;
        let x = posAttr.getX(i) + this.emberVelocities[i].x * delta;
        let z = posAttr.getZ(i) + this.emberVelocities[i].z * delta;

        if (y > 2.0) {
          y = 0;
          x = (Math.random() - 0.5) * 0.35;
          z = (Math.random() - 0.5) * 0.35;
        }

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }
  }

  getInteractionDistance(pos) {
    return this.group.position.distanceTo(pos);
  }
}

export default Anchor;
