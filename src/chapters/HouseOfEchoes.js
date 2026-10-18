/**
 * HouseOfEchoes.js - Chapter 6: The House of Echoes
 * Impossible architecture, inverted staircases, paradoxical rooms,
 * lantern focus perception puzzle (exposing the Borrowed Face's false door),
 * Anchor checkpoint, and gateway to the Last Horizon.
 */

import * as THREE from 'three';
import { Anchor } from '../entities/Anchor.js';
import { MemoryFragment } from '../entities/MemoryFragment.js';
import { Miraj, MIRAJ_FORMS } from '../entities/Miraj.js';

export class HouseOfEchoes {
  constructor(scene, collisionManager, puzzleManager) {
    this.id = 'house-of-echoes';
    this.name = 'THE HOUSE OF ECHOES';
    this.subtitle = 'Where memory bends and reflections tell untruths';
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;

    this.group = new THREE.Group();
    this.group.name = 'Chapter_HouseOfEchoes';

    this.groundMeshes = [];
    this.wallMeshes = [];
    this.anchors = [];
    this.memories = [];
    this.borrowedFace = null;

    // Glowing rune mesh on true door (revealed by Lantern Focus F)
    this.runeMesh = null;

    this.spawnPoint = { x: 0, y: 1.2, z: -5 };
    this.exitTriggerPos = new THREE.Vector3(-6.0, 1.2, 42);

    this.init();
  }

  init() {
    this.scene.add(this.group);

    // Fog & Lighting: Surreal twilight violet and deep indigo
    this.scene.fog = new THREE.FogExp2(0x13111f, 0.03);

    const purpleLight = new THREE.PointLight(0xa588ff, 1.5, 30);
    purpleLight.position.set(0, 8, 15);
    this.group.add(purpleLight);

    const ambLight = new THREE.AmbientLight(0x141224, 1.4);
    this.group.add(ambLight);

    this.buildGeometry();
  }

  buildGeometry() {
    const echoStoneMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b2b,
      roughness: 0.85,
      metalness: 0.2
    });

    const gildedTrimMat = new THREE.MeshStandardMaterial({
      color: 0x6e5a32,
      roughness: 0.3,
      metalness: 0.7
    });

    // 1. Grand Paradoxical Gallery Floor
    const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 50), echoStoneMat);
    hallFloor.position.set(0, -1.0, 18);
    hallFloor.receiveShadow = true;
    hallFloor.userData = { surface: 'stone' };
    this.group.add(hallFloor);
    this.groundMeshes.push(hallFloor);

    // Gallery Walls
    [-11, 11].forEach(x => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 16, 50), echoStoneMat);
      wall.position.set(x, 7, 18);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
      this.wallMeshes.push(wall);
    });

    // 2. Inverted Staircase Suspended from Ceiling (Surreal visual landmark)
    const invertedStairsGroup = new THREE.Group();
    invertedStairsGroup.position.set(0, 11, 14);
    invertedStairsGroup.rotation.z = Math.PI; // upside down!
    for (let i = 0; i < 8; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 1.2), echoStoneMat);
      step.position.set(0, i * 0.5, i * 1.2);
      invertedStairsGroup.add(step);
    }
    this.group.add(invertedStairsGroup);

    // 3. Central Anchor Checkpoint 6
    const anchor6 = new Anchor('anchor-house-of-echoes-1', new THREE.Vector3(0, 0.0, 15), this.id);
    this.group.add(anchor6.group);
    this.anchors.push(anchor6);

    // 4. Memory Relic 1: Shadow Quill (On a floating writing desk)
    const memoryFeather = new MemoryFragment('memory-feather', new THREE.Vector3(5.5, 1.2, 8));
    this.group.add(memoryFeather.group);
    this.memories.push(memoryFeather);

    // Memory Relic 2: Cracked Hand Mirror (Beside the inverted arch)
    const memoryMirror = new MemoryFragment('memory-mirror', new THREE.Vector3(-5.5, 1.2, 26));
    this.group.add(memoryMirror.group);
    this.memories.push(memoryMirror);

    // 5. The Perception Fork: Twin Mirror Portals
    // Right Door: Deceptive door manned by The Borrowed Face
    // Left Door: True door marked with hidden runes visible in lantern focus
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x2d243a });

    // Left True Archway
    const trueArch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.0, 1.0), doorFrameMat);
    trueArch.position.set(-6.0, 1.5, 40);
    this.group.add(trueArch);

    // Golden Runic Inscription (revealed when lantern is focused!)
    const runeGeom = new THREE.PlaneGeometry(1.8, 3.2);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xffcc44,
      transparent: true,
      opacity: 0.15 // Faint until lantern focus
    });
    this.runeMesh = new THREE.Mesh(runeGeom, runeMat);
    this.runeMesh.position.set(-6.0, 1.8, 40.55);
    this.group.add(this.runeMesh);

    // Right False Archway (Miraj's trap)
    const falseArch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.0, 1.0), doorFrameMat);
    falseArch.position.set(6.0, 1.5, 40);
    this.group.add(falseArch);

    // Borrowed Face standing beside the right door
    this.borrowedFace = new Miraj(MIRAJ_FORMS.BORROWED_FACE);
    this.borrowedFace.group.position.set(6.0, 0.0, 39);
    this.borrowedFace.group.rotation.y = Math.PI;
    this.group.add(this.borrowedFace.group);

    // Register Exit Portal (True Left Door)
    this.puzzle.registerInteractable({
      id: 'gate-house-of-echoes',
      type: 'gate_portal',
      position: this.exitTriggerPos,
      interactRadius: 3.5,
      promptText: 'Pass through the True Threshold to the Last Horizon',
      isResolved: false
    });

    this.collision.setColliders(this.groundMeshes, this.wallMeshes);
  }

  update(delta, playerPos, playerSpeed, isCrouching, isRunning, isGrounded, isLanternFocused) {
    this.anchors.forEach(a => a.update(delta));
    this.memories.forEach(m => m.update(delta));

    // When player focuses lantern [F], the golden runes glow brilliantly
    if (this.runeMesh) {
      const targetOpacity = isLanternFocused ? 0.95 : 0.18;
      this.runeMesh.material.opacity += (targetOpacity - this.runeMesh.material.opacity) * 0.1;
    }

    // Borrowed Face subtle twitching
    if (this.borrowedFace) {
      this.borrowedFace.update(delta, 'DECEIVING');
    }
  }

  cleanup() {
    this.scene.remove(this.group);
  }
}

export default HouseOfEchoes;
