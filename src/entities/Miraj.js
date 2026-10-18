/**
 * Miraj.js - 3D Visual Entity for the Antagonist Miraj
 * Implements 6 distinct manifestations:
 * - TALL_WITNESS (Slender towering observer)
 * - CRAWLING_SHAPE (Low stealth stalker sensitive to noise)
 * - BORROWED_FACE (Deceptive humanoid with false lantern)
 * - HOLLOW_GIANT (Massive horizon silhouette)
 * - WHISPER (Dissolving shadowy apparition)
 * - UNFINISHED (Fragmented geometric shadow limbs)
 */

import * as THREE from 'three';

export const MIRAJ_FORMS = {
  TALL_WITNESS: 'tall_witness',
  CRAWLING_SHAPE: 'crawling_shape',
  BORROWED_FACE: 'borrowed_face',
  HOLLOW_GIANT: 'hollow_giant',
  WHISPER: 'whisper',
  UNFINISHED: 'unfinished'
};

export class Miraj {
  constructor(form = MIRAJ_FORMS.TALL_WITNESS) {
    this.form = form;
    this.group = new THREE.Group();
    this.group.name = `Miraj_${form}`;

    this.shadowMaterial = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      roughness: 0.95,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95
    });

    this.eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0xef4444, // Faint red/violet gleam when searching/hunting
      transparent: true,
      opacity: 0.85
    });

    this.animTime = 0;
    this.limbNodes = [];
    this.eyes = [];
    this.auraLight = null;

    this.buildForm(form);
  }

  setForm(form) {
    if (this.form === form) return;
    this.form = form;
    // Clear existing children
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.limbNodes = [];
    this.eyes = [];
    this.buildForm(form);
  }

  buildForm(form) {
    switch (form) {
      case MIRAJ_FORMS.TALL_WITNESS:
        this.buildTallWitness();
        break;
      case MIRAJ_FORMS.CRAWLING_SHAPE:
        this.buildCrawlingShape();
        break;
      case MIRAJ_FORMS.BORROWED_FACE:
        this.buildBorrowedFace();
        break;
      case MIRAJ_FORMS.HOLLOW_GIANT:
        this.buildHollowGiant();
        break;
      case MIRAJ_FORMS.UNFINISHED:
        this.buildUnfinished();
        break;
      case MIRAJ_FORMS.WHISPER:
      default:
        this.buildWhisper();
        break;
    }
  }

  buildTallWitness() {
    // 1. Towering slender body (3.8m tall)
    const torsoGeom = new THREE.CylinderGeometry(0.18, 0.28, 2.4, 8);
    const torso = new THREE.Mesh(torsoGeom, this.shadowMaterial);
    torso.position.y = 2.0;
    this.group.add(torso);

    // 2. Slender elongated head
    const headGeom = new THREE.SphereGeometry(0.22, 8, 8);
    headGeom.scale(0.8, 1.4, 0.9);
    const head = new THREE.Mesh(headGeom, this.shadowMaterial);
    head.position.y = 3.5;
    this.group.add(head);

    // 3. Unnatural long thin arms reaching almost to the knees
    [-0.32, 0.32].forEach((xOffset, idx) => {
      const armGeom = new THREE.CylinderGeometry(0.04, 0.03, 2.2, 6);
      const arm = new THREE.Mesh(armGeom, this.shadowMaterial);
      arm.position.set(xOffset, 2.1, 0);
      arm.rotation.z = idx === 0 ? 0.08 : -0.08;
      this.group.add(arm);
      this.limbNodes.push(arm);
    });

    // 4. Subtle glowing eye points
    const eyeGeom = new THREE.SphereGeometry(0.02, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeom, this.eyeMaterial);
    leftEye.position.set(-0.06, 3.48, 0.16);
    const rightEye = new THREE.Mesh(eyeGeom, this.eyeMaterial);
    rightEye.position.set(0.06, 3.48, 0.16);
    this.group.add(leftEye, rightEye);
    this.eyes.push(leftEye, rightEye);
  }

  buildCrawlingShape() {
    // Low quadruped/arachnid distorted shadow beast (0.9m tall, 2.2m long)
    const bodyGeom = new THREE.SphereGeometry(0.42, 8, 8);
    bodyGeom.scale(1.2, 0.6, 2.0);
    const body = new THREE.Mesh(bodyGeom, this.shadowMaterial);
    body.position.y = 0.55;
    this.group.add(body);

    // Twitching segmented legs (4 limbs)
    const legPositions = [
      { x: -0.5, z: 0.6 },
      { x: 0.5, z: 0.6 },
      { x: -0.6, z: -0.6 },
      { x: 0.6, z: -0.6 }
    ];

    legPositions.forEach((pos, i) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(pos.x, 0.45, pos.z);

      const upperLegGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.7, 6);
      const upperLeg = new THREE.Mesh(upperLegGeom, this.shadowMaterial);
      upperLeg.position.y = 0.25;
      upperLeg.rotation.z = pos.x < 0 ? -0.6 : 0.6;
      legGroup.add(upperLeg);

      const lowerLegGeom = new THREE.CylinderGeometry(0.035, 0.02, 0.7, 6);
      const lowerLeg = new THREE.Mesh(lowerLegGeom, this.shadowMaterial);
      lowerLeg.position.set(pos.x < 0 ? -0.3 : 0.3, -0.15, 0);
      lowerLeg.rotation.z = pos.x < 0 ? 0.8 : -0.8;
      legGroup.add(lowerLeg);

      this.group.add(legGroup);
      this.limbNodes.push(legGroup);
    });

    // Low forward head
    const headGeom = new THREE.ConeGeometry(0.2, 0.45, 6);
    headGeom.rotateX(Math.PI * 0.5);
    const head = new THREE.Mesh(headGeom, this.shadowMaterial);
    head.position.set(0, 0.5, 1.1);
    this.group.add(head);

    // Glowing eyes
    const eyeGeom = new THREE.SphereGeometry(0.025, 6, 6);
    const eye1 = new THREE.Mesh(eyeGeom, this.eyeMaterial);
    eye1.position.set(-0.06, 0.55, 1.25);
    const eye2 = new THREE.Mesh(eyeGeom, this.eyeMaterial);
    eye2.position.set(0.06, 0.55, 1.25);
    this.group.add(eye1, eye2);
    this.eyes.push(eye1, eye2);
  }

  buildBorrowedFace() {
    // Humanoid silhouette with a gentle false pale lantern
    const bodyGeom = new THREE.CylinderGeometry(0.24, 0.38, 1.5, 8);
    const body = new THREE.Mesh(bodyGeom, this.shadowMaterial);
    body.position.y = 0.9;
    this.group.add(body);

    const headGeom = new THREE.SphereGeometry(0.22, 8, 8);
    const head = new THREE.Mesh(headGeom, this.shadowMaterial);
    head.position.y = 1.8;
    this.group.add(head);

    // False Pale Lantern (pale cold blue glow that pretends to guide)
    const falseLantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x99ccff, transparent: true, opacity: 0.8 })
    );
    falseLantern.position.set(0.35, 1.0, 0.4);
    this.group.add(falseLantern);

    this.auraLight = new THREE.PointLight(0x77aaff, 1.5, 6.0);
    this.auraLight.position.set(0.35, 1.0, 0.4);
    this.group.add(this.auraLight);
  }

  buildHollowGiant() {
    // Immense silhouette for Chapter 5 horizon (scale is adjusted)
    const torsoGeom = new THREE.CylinderGeometry(2.5, 4.0, 18.0, 8);
    const torso = new THREE.Mesh(torsoGeom, this.shadowMaterial);
    torso.position.y = 14.0;
    this.group.add(torso);

    const headGeom = new THREE.SphereGeometry(3.0, 8, 8);
    const head = new THREE.Mesh(headGeom, this.shadowMaterial);
    head.position.y = 25.0;
    this.group.add(head);

    // Huge glowing twin hollow eyes
    const eyeGeom = new THREE.SphereGeometry(0.6, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeom, this.eyeMaterial);
    leftEye.position.set(-1.0, 25.2, 2.4);
    const rightEye = new THREE.Mesh(eyeGeom, this.eyeMaterial);
    rightEye.position.set(1.0, 25.2, 2.4);
    this.group.add(leftEye, rightEye);
    this.eyes.push(leftEye, rightEye);
  }

  buildWhisper() {
    // Drifting semi-transparent phantom shadow
    const geom = new THREE.ConeGeometry(0.4, 2.0, 8, 3);
    geom.rotateX(Math.PI);
    const mesh = new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        color: 0x020408,
        transparent: true,
        opacity: 0.65,
        roughness: 1.0
      })
    );
    mesh.position.y = 1.0;
    this.group.add(mesh);
    this.limbNodes.push(mesh);
  }

  buildUnfinished() {
    // Shifting fragmented angular limbs
    for (let i = 0; i < 6; i++) {
      const boxGeom = new THREE.BoxGeometry(0.12, 0.8 + Math.random() * 0.6, 0.12);
      const box = new THREE.Mesh(boxGeom, this.shadowMaterial);
      box.position.set(
        (Math.random() - 0.5) * 0.8,
        1.0 + Math.random() * 1.5,
        (Math.random() - 0.5) * 0.8
      );
      box.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.group.add(box);
      this.limbNodes.push(box);
    }
  }

  update(delta, state) {
    this.animTime += delta;

    // Eye color / brightness shifts with state
    const isHunting = state === 'HUNTING';
    const isSearching = state === 'SEARCHING' || state === 'INVESTIGATING';

    if (this.eyes.length > 0) {
      const eyeColor = isHunting ? 0xff2222 : (isSearching ? 0xffaa22 : 0xaa4466);
      this.eyeMaterial.color.setHex(eyeColor);
      this.eyeMaterial.opacity = isHunting ? 1.0 : (isSearching ? 0.75 : 0.4);
    }

    // Procedural movement animation
    if (this.form === MIRAJ_FORMS.CRAWLING_SHAPE) {
      // Skittering legs
      const speed = isHunting ? 18 : 8;
      this.limbNodes.forEach((leg, i) => {
        const offset = i * Math.PI * 0.5;
        leg.rotation.x = Math.sin(this.animTime * speed + offset) * 0.45;
      });
    } else if (this.form === MIRAJ_FORMS.TALL_WITNESS) {
      // Looming breathing sway
      const sway = Math.sin(this.animTime * 1.8) * 0.04;
      this.group.position.y += sway * delta;
      this.limbNodes.forEach((arm, i) => {
        arm.rotation.x = Math.sin(this.animTime * 1.2 + i) * 0.12;
      });
    } else if (this.form === MIRAJ_FORMS.UNFINISHED) {
      // Twitching shifting limbs
      this.limbNodes.forEach((limb, i) => {
        limb.rotation.y += delta * (i % 2 === 0 ? 2 : -2);
        limb.position.y += Math.sin(this.animTime * 4 + i) * 0.005;
      });
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}

export default Miraj;
