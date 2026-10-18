/**
 * PlaceBetween.js - Chapter 1: The Place Between
 * Floating stone platforms suspended above an infinite void, cold blue mist,
 * movement tutorials (walk, leap across broken bridge, climb low ledge),
 * first memory fragment, first Anchor checkpoint, distant sighting of Miraj.
 */

import * as THREE from 'three';
import { Anchor } from '../entities/Anchor.js';
import { MemoryFragment } from '../entities/MemoryFragment.js';
import { Miraj, MIRAJ_FORMS } from '../entities/Miraj.js';

export class PlaceBetween {
  constructor(scene, collisionManager, puzzleManager) {
    this.id = 'place-between';
    this.name = 'THE PLACE BETWEEN';
    this.subtitle = 'A narrow stone platform surrounded by fog';
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;

    this.group = new THREE.Group();
    this.group.name = 'Chapter_PlaceBetween';

    this.groundMeshes = [];
    this.wallMeshes = [];
    this.anchors = [];
    this.memories = [];
    this.mirajEntity = null;

    this.spawnPoint = { x: 0, y: 1.5, z: 0 };
    this.exitTriggerPos = new THREE.Vector3(0, 3.5, 46);

    this.init();
  }

  init() {
    this.scene.add(this.group);

    // Fog & Lighting for Chapter 1: Cold Blue Void Fog
    this.scene.fog = new THREE.FogExp2(0x0c131d, 0.028);

    const dirLight = new THREE.DirectionalLight(0xaaccff, 1.2);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    this.group.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x162233, 1.4);
    this.group.add(ambLight);

    this.buildGeometry();
  }

  buildGeometry() {
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2733,
      roughness: 0.9,
      metalness: 0.1
    });

    const brokenStoneMat = new THREE.MeshStandardMaterial({
      color: 0x2a3545,
      roughness: 0.85,
      metalness: 0.15
    });

    // 1. Wakeup Island (Platform A)
    const islandAGeom = new THREE.BoxGeometry(10, 3, 12);
    const islandA = new THREE.Mesh(islandAGeom, stoneMaterial);
    islandA.position.set(0, -1.5, 0);
    islandA.receiveShadow = true;
    islandA.castShadow = true;
    islandA.userData = { surface: 'stone' };
    this.group.add(islandA);
    this.groundMeshes.push(islandA);

    // Stone Pillars around Platform A
    [-4, 4].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 5, 8), stoneMaterial);
      pillar.position.set(x, 1.5, -4);
      pillar.castShadow = true;
      this.group.add(pillar);
      this.wallMeshes.push(pillar);
    });

    // 2. Broken Bridge Section 1
    const bridge1Geom = new THREE.BoxGeometry(4, 1.5, 8);
    const bridge1 = new THREE.Mesh(bridge1Geom, stoneMaterial);
    bridge1.position.set(0, -0.75, 10);
    bridge1.receiveShadow = true;
    bridge1.castShadow = true;
    bridge1.userData = { surface: 'stone' };
    this.group.add(bridge1);
    this.groundMeshes.push(bridge1);

    // Void gap between bridge 1 and bridge 2 (requires sprint jump!)
    // 3. Broken Bridge Section 2 (Leap Target)
    const bridge2Geom = new THREE.BoxGeometry(4.5, 1.5, 7);
    const bridge2 = new THREE.Mesh(bridge2Geom, brokenStoneMat);
    bridge2.position.set(0, -0.75, 18);
    bridge2.receiveShadow = true;
    bridge2.castShadow = true;
    bridge2.userData = { surface: 'stone' };
    this.group.add(bridge2);
    this.groundMeshes.push(bridge2);

    // 4. Low Ledge Obstacle (Tutorial for Mantling / Climbing)
    const ledgeGeom = new THREE.BoxGeometry(6, 1.4, 2);
    const ledgeObstacle = new THREE.Mesh(ledgeGeom, stoneMaterial);
    ledgeObstacle.position.set(0, 0.7, 23);
    ledgeObstacle.receiveShadow = true;
    ledgeObstacle.castShadow = true;
    ledgeObstacle.userData = { surface: 'stone' };
    this.group.add(ledgeObstacle);
    this.groundMeshes.push(ledgeObstacle);
    this.wallMeshes.push(ledgeObstacle);

    // 5. Anchor Sanctuary Island (Platform B)
    const islandBGeom = new THREE.BoxGeometry(14, 4, 16);
    const islandB = new THREE.Mesh(islandBGeom, stoneMaterial);
    islandB.position.set(0, 0, 32);
    islandB.receiveShadow = true;
    islandB.castShadow = true;
    islandB.userData = { surface: 'stone' };
    this.group.add(islandB);
    this.groundMeshes.push(islandB);

    // Anchor Checkpoint 1
    const anchor1 = new Anchor('anchor-place-between-1', new THREE.Vector3(0, 2.0, 30), this.id);
    this.group.add(anchor1.group);
    this.anchors.push(anchor1);

    // First Memory Relic: Ancient Iron Key
    const memoryKey = new MemoryFragment('memory-key', new THREE.Vector3(3.5, 2.5, 33));
    this.group.add(memoryKey.group);
    this.memories.push(memoryKey);

    // Second Memory Relic: Carved Bone Flute
    const memoryFlute = new MemoryFragment('memory-flute', new THREE.Vector3(-3.5, 2.5, 33));
    this.group.add(memoryFlute.group);
    this.memories.push(memoryFlute);

    // 6. Grand Ancient Stone Archway (Exit Threshold)
    const archMat = new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.8 });
    const archPostL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), archMat);
    archPostL.position.set(-3.2, 5.5, 45);
    const archPostR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), archMat);
    archPostR.position.set(3.2, 5.5, 45);
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.2, 1.4), archMat);
    archBeam.position.set(0, 8.5, 45);
    this.group.add(archPostL, archPostR, archBeam);
    this.wallMeshes.push(archPostL, archPostR);

    // Distant Precipice with Miraj: The Tall Witness watching from far away
    const distantPrecipice = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 6), stoneMaterial);
    distantPrecipice.position.set(0, 4, 65);
    this.group.add(distantPrecipice);

    this.mirajEntity = new Miraj(MIRAJ_FORMS.TALL_WITNESS);
    this.mirajEntity.group.position.set(0, 10, 65);
    this.group.add(this.mirajEntity.group);

    // Register Gate Trigger with PuzzleManager
    this.puzzle.registerInteractable({
      id: 'gate-place-between',
      type: 'gate_portal',
      position: this.exitTriggerPos,
      interactRadius: 3.5,
      promptText: 'Step into the Abandoned City',
      isResolved: false
    });

    // Update collision manager
    this.collision.setColliders(this.groundMeshes, this.wallMeshes);
  }

  update(delta, playerPos) {
    // Update anchors and memories
    this.anchors.forEach(a => a.update(delta));
    this.memories.forEach(m => m.update(delta));

    // Tall witness disappears if player approaches too close (mysterious observation)
    if (this.mirajEntity && this.mirajEntity.group.visible) {
      this.mirajEntity.update(delta, 'WATCHING');
      const dist = this.mirajEntity.group.position.distanceTo(playerPos);
      if (dist < 22) {
        // Melt into mist
        this.mirajEntity.setVisible(false);
      }
    }
  }

  cleanup() {
    this.scene.remove(this.group);
  }
}

export default PlaceBetween;
