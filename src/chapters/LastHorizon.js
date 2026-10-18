/**
 * LastHorizon.js - Chapter 7: The Last Horizon
 * Vast peaceful plains of pale grass, reflective twilight waters,
 * three Echo Resonator altars, final peaceful dialogue with Miraj,
 * the sanctuary of belonging, and the emotional story conclusion.
 */

import * as THREE from 'three';
import { Anchor } from '../entities/Anchor.js';
import { MemoryFragment } from '../entities/MemoryFragment.js';
import { Miraj, MIRAJ_FORMS } from '../entities/Miraj.js';
import { audioManager } from '../game/AudioManager.js';

export class LastHorizon {
  constructor(scene, collisionManager, puzzleManager) {
    this.id = 'last-horizon';
    this.name = 'THE LAST HORIZON';
    this.subtitle = 'Where the search ends and quiet begins';
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;

    this.group = new THREE.Group();
    this.group.name = 'Chapter_LastHorizon';

    this.groundMeshes = [];
    this.wallMeshes = [];
    this.anchors = [];
    this.memories = [];
    this.mirajEntity = null;

    this.spawnPoint = { x: 0, y: 1.2, z: -10 };
    this.finalSanctuaryPos = new THREE.Vector3(0, 1.2, 58);

    this.altarsActive = 0;
    this.hasMirajDissolved = false;

    this.init();
  }

  init() {
    this.scene.add(this.group);

    // Fog & Lighting: Soft transparent dusk twilight
    this.scene.fog = new THREE.FogExp2(0x131926, 0.018);

    const warmDuskLight = new THREE.DirectionalLight(0xf2c89b, 1.5);
    warmDuskLight.position.set(-20, 30, 20);
    this.group.add(warmDuskLight);

    const ambLight = new THREE.AmbientLight(0x242a3a, 1.4);
    this.group.add(ambLight);

    this.buildGeometry();
  }

  buildGeometry() {
    // 1. Vast Reflective Ground Plane
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a212d,
      roughness: 0.6,
      metalness: 0.2
    });

    const groundGeom = new THREE.BoxGeometry(60, 2, 90);
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, -1.0, 30);
    ground.receiveShadow = true;
    ground.userData = { surface: 'stone' };
    this.group.add(ground);
    this.groundMeshes.push(ground);

    // 2. Pale Grass Tuft Clumps (instanced aesthetic decoration)
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0xdde6ed,
      roughness: 0.9,
      metalness: 0.05
    });

    for (let i = 0; i < 60; i++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 5), grassMat);
      tuft.position.set(
        (Math.random() - 0.5) * 44,
        0.45,
        (Math.random() - 0.5) * 70 + 30
      );
      tuft.rotation.y = Math.random() * Math.PI;
      this.group.add(tuft);
    }

    // 3. Final Anchor Checkpoint 7
    const anchor7 = new Anchor('anchor-last-horizon-1', new THREE.Vector3(0, 0.0, 5), this.id);
    this.group.add(anchor7.group);
    this.anchors.push(anchor7);

    // 4. Memory Relic 1: Warm Hearth Stone (Near the central reflecting pool)
    const memoryHearth = new MemoryFragment('memory-hearth', new THREE.Vector3(-6.5, 1.2, 18));
    this.group.add(memoryHearth.group);
    this.memories.push(memoryHearth);

    // Memory Relic 2: Twin Amber Filament (Beside the final altar)
    const memoryLantern = new MemoryFragment('memory-lantern', new THREE.Vector3(6.5, 1.2, 42));
    this.group.add(memoryLantern.group);
    this.memories.push(memoryLantern);

    // 5. Three Echo Resonator Altars
    const altarCoords = [
      { id: 'altar-1', pos: new THREE.Vector3(-8, 0, 28) },
      { id: 'altar-2', pos: new THREE.Vector3(0, 0, 36) },
      { id: 'altar-3', pos: new THREE.Vector3(8, 0, 28) }
    ];

    altarCoords.forEach(alt => {
      const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.0, 8), groundMat);
      altarBase.position.copy(alt.pos).add(new THREE.Vector3(0, 0.5, 0));
      this.group.add(altarBase);
      this.groundMeshes.push(altarBase);

      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffcc44 })
      );
      flame.position.copy(alt.pos).add(new THREE.Vector3(0, 1.2, 0));
      flame.visible = false;
      this.group.add(flame);

      const pLight = new THREE.PointLight(0xffaa33, 0, 6);
      pLight.position.copy(flame.position);
      this.group.add(pLight);

      this.puzzle.registerInteractable({
        id: alt.id,
        type: 'echo_altar',
        position: alt.pos,
        interactRadius: 2.5,
        flameMesh: flame,
        pointLight: pLight,
        promptText: 'Attune Memory Echo',
        isResolved: false
      });
    });

    // 6. Miraj Final Entity: Standing in quiet contemplation at Z = 48
    this.mirajEntity = new Miraj(MIRAJ_FORMS.TALL_WITNESS);
    this.mirajEntity.group.position.set(0, 0.0, 48);
    this.mirajEntity.group.rotation.y = Math.PI;
    this.group.add(this.mirajEntity.group);

    // 7. Final Threshold Sanctuary: A warm wooden hearth archway with welcoming light
    const sanctuaryArchMat = new THREE.MeshStandardMaterial({ color: 0x3d3024, roughness: 0.8 });
    const sBeamL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), sanctuaryArchMat);
    sBeamL.position.set(-2.2, 2.25, 58);
    const sBeamR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), sanctuaryArchMat);
    sBeamR.position.set(2.2, 2.25, 58);
    const sBeamTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.8, 0.8), sanctuaryArchMat);
    sBeamTop.position.set(0, 4.6, 58);
    this.group.add(sBeamL, sBeamR, sBeamTop);

    // Warm inviting sanctuary hearth light
    const hearthLight = new THREE.PointLight(0xffb347, 4.0, 20);
    hearthLight.position.set(0, 2.0, 60);
    this.group.add(hearthLight);

    // Final trigger: Arriving at the Hearth
    this.puzzle.registerInteractable({
      id: 'gate-final-sanctuary',
      type: 'gate_portal',
      position: this.finalSanctuaryPos,
      interactRadius: 3.2,
      promptText: 'Step into the Hearth of Belonging',
      isResolved: false
    });

    this.collision.setColliders(this.groundMeshes, this.wallMeshes);
  }

  update(delta, playerPos) {
    this.anchors.forEach(a => a.update(delta));
    this.memories.forEach(m => m.update(delta));

    // When player approaches Miraj peacefully at Z > 38
    if (this.mirajEntity && !this.hasMirajDissolved) {
      this.mirajEntity.update(delta, 'WATCHING');
      const dist = this.mirajEntity.group.position.distanceTo(playerPos);
      if (dist < 5.0) {
        // Miraj dissolves peacefully
        this.hasMirajDissolved = true;
        this.mirajEntity.setVisible(false);
      }
    }
  }

  cleanup() {
    this.scene.remove(this.group);
  }
}

export default LastHorizon;
