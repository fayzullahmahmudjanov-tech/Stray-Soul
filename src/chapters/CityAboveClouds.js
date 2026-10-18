/**
 * CityAboveClouds.js - Chapter 5: The City Above the Clouds
 * High-altitude mountain spires, sea of drifting clouds, wind howling,
 * rotating clocktower gear mechanism puzzle, Hollow Giant horizon silhouette,
 * Anchor checkpoint, and entrance to the House of Echoes.
 */

import * as THREE from 'three';
import { Anchor } from '../entities/Anchor.js';
import { MemoryFragment } from '../entities/MemoryFragment.js';
import { Miraj, MIRAJ_FORMS } from '../entities/Miraj.js';

export class CityAboveClouds {
  constructor(scene, collisionManager, puzzleManager) {
    this.id = 'city-above-clouds';
    this.name = 'THE CITY ABOVE THE CLOUDS';
    this.subtitle = 'Gothic spires piercing an endless sea of mist';
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;

    this.group = new THREE.Group();
    this.group.name = 'Chapter_CityAboveClouds';

    this.groundMeshes = [];
    this.wallMeshes = [];
    this.anchors = [];
    this.memories = [];
    this.hollowGiant = null;

    this.spawnPoint = { x: 0, y: 1.5, z: -8 };
    this.exitTriggerPos = new THREE.Vector3(0, 8.5, 56);

    this.init();
  }

  init() {
    this.scene.add(this.group);

    // Fog & Lighting: Golden sunset cloud mist above the world
    this.scene.fog = new THREE.FogExp2(0x181c2b, 0.022);

    const sunLight = new THREE.DirectionalLight(0xf5d09b, 1.4);
    sunLight.position.set(30, 45, 20);
    sunLight.castShadow = true;
    this.group.add(sunLight);

    const ambLight = new THREE.AmbientLight(0x232738, 1.2);
    this.group.add(ambLight);

    this.buildGeometry();
  }

  buildGeometry() {
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0x364152,
      roughness: 0.7,
      metalness: 0.15
    });

    const brassGearMat = new THREE.MeshStandardMaterial({
      color: 0x8a6a3b,
      roughness: 0.35,
      metalness: 0.8
    });

    // 1. Sea of Clouds Beneath
    const cloudGeom = new THREE.PlaneGeometry(200, 200, 8, 8);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x1f2638,
      transparent: true,
      opacity: 0.7
    });
    const cloudPlane = new THREE.Mesh(cloudGeom, cloudMat);
    cloudPlane.position.y = -8;
    cloudPlane.rotation.x = -Math.PI * 0.5;
    this.group.add(cloudPlane);

    // 2. Base Spire Platform (Elevator landing)
    const spire1 = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 7.0, 20, 10), marbleMat);
    spire1.position.set(0, -9.0, 0);
    spire1.receiveShadow = true;
    spire1.userData = { surface: 'stone' };
    this.group.add(spire1);
    this.groundMeshes.push(spire1);

    // 3. Narrow High Bridge Section
    const bridgeGeom = new THREE.BoxGeometry(2.4, 0.8, 18);
    const bridge = new THREE.Mesh(bridgeGeom, marbleMat);
    bridge.position.set(0, 0.6, 14);
    bridge.receiveShadow = true;
    bridge.userData = { surface: 'stone' };
    this.group.add(bridge);
    this.groundMeshes.push(bridge);

    // 4. Central Clocktower Gear Platform (Puzzle mechanism)
    const towerGeom = new THREE.CylinderGeometry(7.0, 8.5, 24, 12);
    const tower = new THREE.Mesh(towerGeom, marbleMat);
    tower.position.set(0, -9.0, 32);
    tower.receiveShadow = true;
    tower.userData = { surface: 'stone' };
    this.group.add(tower);
    this.groundMeshes.push(tower);

    // Rotating Brass Gear Platform that aligns the bridge to the Observatory
    const gearRingGeom = new THREE.CylinderGeometry(3.0, 3.0, 0.6, 8);
    const gearRing = new THREE.Mesh(gearRingGeom, brassGearMat);
    gearRing.position.set(0, 3.3, 32);
    gearRing.userData = { surface: 'metal' };
    this.group.add(gearRing);
    this.groundMeshes.push(gearRing);

    // Connecting Bridge Segment (revealed when gear aligned)
    const finalBridgeGeom = new THREE.BoxGeometry(2.4, 0.6, 12);
    const finalBridge = new THREE.Mesh(finalBridgeGeom, marbleMat);
    finalBridge.position.set(0, 3.3, 44);
    finalBridge.visible = false; // Hidden until puzzle solved
    finalBridge.userData = { surface: 'stone' };
    this.group.add(finalBridge);
    this.groundMeshes.push(finalBridge);

    // Gear Lever on Tower
    const leverStand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8), brassGearMat);
    leverStand.position.set(2.8, 3.6, 30);
    this.group.add(leverStand);

    this.puzzle.registerInteractable({
      id: 'lever-clocktower-gear',
      type: 'gear_lever',
      position: new THREE.Vector3(2.8, 3.6, 30),
      interactRadius: 2.2,
      gearMesh: gearRing,
      gearStep: 0,
      targetStep: 2, // Rotates to alignment at step 2
      bridgeMesh: finalBridge,
      promptText: 'Turn Clocktower Ring'
    });

    // 5. Far Observatory Spire
    const spire2 = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 8.0, 30, 10), marbleMat);
    spire2.position.set(0, -6.0, 56);
    spire2.receiveShadow = true;
    spire2.userData = { surface: 'stone' };
    this.group.add(spire2);
    this.groundMeshes.push(spire2);

    // 6. Anchor Checkpoint 5 (On the Observatory Spire)
    const anchor5 = new Anchor('anchor-city-above-clouds-1', new THREE.Vector3(0, 9.0, 54), this.id);
    this.group.add(anchor5.group);
    this.anchors.push(anchor5);

    // 7. Memory Relic 1: Tarnished Silver Locket (On bridge precipice)
    const memoryLocket = new MemoryFragment('memory-locket', new THREE.Vector3(-1.8, 1.8, 14));
    this.group.add(memoryLocket.group);
    this.memories.push(memoryLocket);

    // Memory Relic 2: Star Observatory Lens (Atop the telescope balustrade)
    const memoryLens = new MemoryFragment('memory-lens', new THREE.Vector3(3.2, 10.0, 56));
    this.group.add(memoryLens.group);
    this.memories.push(memoryLens);

    // 8. Exit portal to House of Echoes
    this.puzzle.registerInteractable({
      id: 'gate-city-above-clouds',
      type: 'gate_portal',
      position: this.exitTriggerPos,
      interactRadius: 3.5,
      promptText: 'Enter the House of Echoes',
      isResolved: false
    });

    // 9. Cinematic Antagonist: The Hollow Giant crossing the distant horizon
    this.hollowGiant = new Miraj(MIRAJ_FORMS.HOLLOW_GIANT);
    this.hollowGiant.group.position.set(65, 0, 75);
    this.hollowGiant.group.rotation.y = -Math.PI * 0.4;
    this.group.add(this.hollowGiant.group);

    this.collision.setColliders(this.groundMeshes, this.wallMeshes);
  }

  update(delta, playerPos) {
    this.anchors.forEach(a => a.update(delta));
    this.memories.forEach(m => m.update(delta));

    // Slow majestic stride of Hollow Giant across the cloudline
    if (this.hollowGiant) {
      this.hollowGiant.group.position.x -= delta * 0.8;
      this.hollowGiant.update(delta, 'WATCHING');
    }
  }

  cleanup() {
    this.scene.remove(this.group);
  }
}

export default CityAboveClouds;
