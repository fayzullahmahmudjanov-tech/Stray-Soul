/**
 * StraySoul.js - The Playable Protagonist
 * Stylized 3D character with layered hooded cloak, glowing eye motes in shadow,
 * swinging amber lantern with dynamic lighting, and procedural skeletal animation.
 */

import * as THREE from 'three';

export class StraySoul {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'StraySoul';

    // Animation state timers
    this.animTime = 0;
    this.stepTimer = 0;
    this.isDead = false;
    this.isLanternFocused = false;
    this.focusCharge = 1.0; // 0 to 1

    // Model nodes
    this.bodyGroup = null;
    this.hoodMesh = null;
    this.cloakMesh = null;
    this.eyesMesh = null;
    this.lanternGroup = null;
    this.lanternLight = null;
    this.lanternCore = null;

    this.buildModel();
  }

  buildModel() {
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    // Dark weathered cloak material
    const cloakMaterial = new THREE.MeshStandardMaterial({
      color: 0x161c24,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: false
    });

    // Dark interior shadow material
    const shadowInteriorMaterial = new THREE.MeshBasicMaterial({
      color: 0x05070a
    });

    // Glowing eyes material
    const eyesMaterial = new THREE.MeshBasicMaterial({
      color: 0xf5deb3,
      transparent: true,
      opacity: 0.95
    });

    // 1. Lower Body / Tapered Cloak Hem
    const cloakGeom = new THREE.CylinderGeometry(0.22, 0.44, 0.9, 14, 4);
    // Displace vertices slightly for organic cloth drape
    const posAttr = cloakGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y < 0) {
        const noise = (Math.sin(posAttr.getX(i) * 12) + Math.cos(posAttr.getZ(i) * 10)) * 0.025;
        posAttr.setX(i, posAttr.getX(i) + noise);
        posAttr.setZ(i, posAttr.getZ(i) + noise);
      }
    }
    cloakGeom.computeVertexNormals();

    this.cloakMesh = new THREE.Mesh(cloakGeom, cloakMaterial);
    this.cloakMesh.position.y = 0.45;
    this.cloakMesh.castShadow = true;
    this.cloakMesh.receiveShadow = true;
    this.bodyGroup.add(this.cloakMesh);

    // 2. Chest / Torso layer
    const torsoGeom = new THREE.CylinderGeometry(0.18, 0.24, 0.4, 10);
    const torsoMesh = new THREE.Mesh(torsoGeom, cloakMaterial);
    torsoMesh.position.y = 0.85;
    this.bodyGroup.add(torsoMesh);

    // 3. Hood & Head
    const hoodGroup = new THREE.Group();
    hoodGroup.position.set(0, 1.12, 0.02);
    this.bodyGroup.add(hoodGroup);

    // Outer Hood Dome
    const hoodGeom = new THREE.SphereGeometry(0.25, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.7);
    this.hoodMesh = new THREE.Mesh(hoodGeom, cloakMaterial);
    this.hoodMesh.rotation.x = 0.15;
    hoodGroup.add(this.hoodMesh);

    // Shadowed Face Hollow (Black Inset)
    const faceCavityGeom = new THREE.CircleGeometry(0.16, 12);
    const faceCavity = new THREE.Mesh(faceCavityGeom, shadowInteriorMaterial);
    faceCavity.position.set(0, -0.04, 0.14);
    faceCavity.rotation.y = 0;
    hoodGroup.add(faceCavity);

    // Subtle Glowing Eyes
    const eyeGeom = new THREE.SphereGeometry(0.025, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeom, eyesMaterial);
    leftEye.position.set(-0.065, -0.03, 0.16);
    hoodGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyesMaterial);
    rightEye.position.set(0.065, -0.03, 0.16);
    hoodGroup.add(rightEye);

    this.eyesMesh = [leftEye, rightEye];

    // 4. Lantern Hand and Warm Lantern
    this.buildLantern();
  }

  buildLantern() {
    this.lanternGroup = new THREE.Group();
    this.lanternGroup.position.set(0.28, 0.55, 0.22);
    this.bodyGroup.add(this.lanternGroup);

    // Iron Top Cap & Chain
    const ironMaterial = new THREE.MeshStandardMaterial({
      color: 0x242426,
      metalness: 0.8,
      roughness: 0.4
    });

    const capGeom = new THREE.ConeGeometry(0.09, 0.07, 8);
    const capMesh = new THREE.Mesh(capGeom, ironMaterial);
    capMesh.position.y = 0.08;
    this.lanternGroup.add(capMesh);

    const baseGeom = new THREE.CylinderGeometry(0.08, 0.09, 0.04, 8);
    const baseMesh = new THREE.Mesh(baseGeom, ironMaterial);
    baseMesh.position.y = -0.12;
    this.lanternGroup.add(baseMesh);

    // Glass Cylinder
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe6a3,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1
    });
    const glassGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.16, 8);
    const glassMesh = new THREE.Mesh(glassGeom, glassMaterial);
    glassMesh.position.y = -0.02;
    this.lanternGroup.add(glassMesh);

    // Glowing Inner Flame Core
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa33
    });
    const flameGeom = new THREE.SphereGeometry(0.035, 6, 6);
    this.lanternCore = new THREE.Mesh(flameGeom, flameMaterial);
    this.lanternCore.position.y = -0.02;
    this.lanternGroup.add(this.lanternCore);

    // Dynamic Point Light
    this.lanternLight = new THREE.PointLight(0xff9933, 2.8, 8.5, 1.8);
    this.lanternLight.position.set(0, -0.02, 0);
    this.lanternLight.castShadow = true;
    this.lanternLight.shadow.bias = -0.002;
    this.lanternLight.shadow.mapSize.width = 512;
    this.lanternLight.shadow.mapSize.height = 512;
    this.lanternGroup.add(this.lanternLight);
  }

  setLanternFocus(active) {
    this.isLanternFocused = active;
  }

  updateAnimation(delta, moveSpeed, isGrounded, isCrouching, isRunning) {
    if (this.isDead) return;

    this.animTime += delta;

    // 1. Lantern Flickering Light
    const flicker = Math.sin(this.animTime * 14) * 0.12 + Math.cos(this.animTime * 23) * 0.08;
    if (this.isLanternFocused && this.focusCharge > 0.05) {
      // Focused Beam
      this.lanternLight.distance = 15.0;
      this.lanternLight.intensity = 4.8 + flicker;
      this.lanternLight.color.setHex(0xffc066);
      this.lanternCore.scale.setScalar(1.5);
      this.focusCharge = Math.max(0, this.focusCharge - delta * 0.2);
    } else {
      // Normal Warm Hearth
      this.lanternLight.distance = 9.0;
      this.lanternLight.intensity = 2.6 + flicker;
      this.lanternLight.color.setHex(0xff9933);
      this.lanternCore.scale.setScalar(1.0);
      this.focusCharge = Math.min(1.0, this.focusCharge + delta * 0.15);
    }

    // 2. Crouch Posture
    const targetScaleY = isCrouching ? 0.76 : 1.0;
    this.bodyGroup.scale.y += (targetScaleY - this.bodyGroup.scale.y) * 0.15;

    // 3. Movement Animation Cycles
    if (!isGrounded) {
      // In-Air / Falling Pose
      this.bodyGroup.position.y = 0.05;
      this.cloakMesh.rotation.x = -0.15;
      this.lanternGroup.position.set(0.3, 0.65, 0.15);
      this.lanternGroup.rotation.x = 0.2;
    } else if (moveSpeed > 0.2) {
      // Walking / Running Cycle
      const strideFreq = isRunning ? 12.0 : 7.5;
      const bob = Math.sin(this.animTime * strideFreq) * (isRunning ? 0.05 : 0.025);
      const sway = Math.cos(this.animTime * strideFreq * 0.5) * (isRunning ? 0.06 : 0.03);

      this.bodyGroup.position.y = bob;
      this.bodyGroup.rotation.z = sway;
      this.bodyGroup.rotation.x = isRunning ? 0.18 : 0.08;

      // Cloak drag behind
      this.cloakMesh.rotation.x = isRunning ? -0.2 : -0.1;

      // Natural pendulum lantern swing
      const lanternSwingZ = Math.sin(this.animTime * strideFreq) * (isRunning ? 0.45 : 0.25);
      const lanternSwingX = Math.cos(this.animTime * strideFreq) * (isRunning ? 0.35 : 0.15);
      this.lanternGroup.rotation.z = lanternSwingZ;
      this.lanternGroup.rotation.x = lanternSwingX;
    } else {
      // Idle Breathing Cycle
      const breathe = Math.sin(this.animTime * 2.2) * 0.015;
      this.bodyGroup.position.y = breathe;
      this.bodyGroup.rotation.set(0, 0, 0);
      this.cloakMesh.rotation.set(0, 0, 0);

      // Subtle lantern sway
      this.lanternGroup.position.set(0.28, 0.55 + breathe * 0.5, 0.22);
      this.lanternGroup.rotation.z = Math.sin(this.animTime * 1.5) * 0.08;
      this.lanternGroup.rotation.x = Math.cos(this.animTime * 1.2) * 0.05;
    }

    // Eye blinking
    const blinkVal = Math.sin(this.animTime * 0.8);
    const isBlinking = blinkVal > 0.96;
    if (this.eyesMesh) {
      this.eyesMesh.forEach(eye => {
        eye.scale.y = isBlinking ? 0.1 : 1.0;
      });
    }
  }

  playDeathAnimation() {
    this.isDead = true;
    // Lantern goes dim, soul crumples
    if (this.lanternLight) {
      this.lanternLight.intensity = 0.2;
    }
    this.bodyGroup.scale.set(0.9, 0.4, 0.9);
    this.bodyGroup.position.y = -0.2;
  }

  respawn(position) {
    this.isDead = false;
    this.bodyGroup.scale.set(1, 1, 1);
    this.bodyGroup.position.set(0, 0, 0);
    this.group.position.copy(position);
    if (this.lanternLight) {
      this.lanternLight.intensity = 2.6;
    }
  }

  getPosition() {
    return this.group.position;
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }
}

export default StraySoul;
