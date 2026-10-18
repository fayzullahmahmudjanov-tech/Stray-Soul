/**
 * DrownedForest.js - Chapter 3: The Drowned Forest
 * Submerged ancient roots, shallow reflective water, sound-sensitive stealth,
 * sluice gate drainage valve puzzle, Anchor checkpoint, and railway portal.
 */

import * as THREE from 'three';
import { Anchor } from '../entities/Anchor.js';
import { MemoryFragment } from '../entities/MemoryFragment.js';
import { Miraj, MIRAJ_FORMS } from '../entities/Miraj.js';
import { MirajAI, AI_STATES } from '../game/MirajAI.js';

export class DrownedForest {
  constructor(scene, collisionManager, puzzleManager) {
    this.id = 'drowned-forest';
    this.name = 'THE DROWNED FOREST';
    this.subtitle = 'Ancient roots submerged in still water';
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;

    this.group = new THREE.Group();
    this.group.name = 'Chapter_DrownedForest';

    this.groundMeshes = [];
    this.wallMeshes = [];
    this.anchors = [];
    this.memories = [];
    this.mirajEntity = null;
    this.mirajAI = null;

    this.spawnPoint = { x: 0, y: 1.2, z: -8 };
    this.exitTriggerPos = new THREE.Vector3(0, 1.2, 54);

    this.init();
  }

  init() {
    this.scene.add(this.group);

    // Fog & Lighting: Deep emerald & teal swamp haze
    this.scene.fog = new THREE.FogExp2(0x0e1b18, 0.035);

    const dirLight = new THREE.DirectionalLight(0x78ab92, 0.9);
    dirLight.position.set(10, 30, -10);
    dirLight.castShadow = true;
    this.group.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x132420, 1.3);
    this.group.add(ambLight);

    this.buildGeometry();
  }

  buildGeometry() {
    // Water Bed Floor
    const waterBedMat = new THREE.MeshStandardMaterial({
      color: 0x111c18,
      roughness: 0.95,
      metalness: 0.05
    });

    const rootMat = new THREE.MeshStandardMaterial({
      color: 0x2b2219,
      roughness: 0.85,
      metalness: 0.1
    });

    const waterSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a30,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.75
    });

    // 1. Muddy Water Floor (Makes loud splashing sounds when walked on!)
    const swampFloorGeom = new THREE.BoxGeometry(28, 2, 70);
    const swampFloor = new THREE.Mesh(swampFloorGeom, waterBedMat);
    swampFloor.position.set(0, -1.0, 22);
    swampFloor.receiveShadow = true;
    swampFloor.userData = { surface: 'water' };
    this.group.add(swampFloor);
    this.groundMeshes.push(swampFloor);

    // Water Surface Visual Plane
    const waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(28, 70), waterSurfaceMat);
    waterPlane.position.set(0, 0.08, 22);
    waterPlane.rotation.x = -Math.PI * 0.5;
    this.group.add(waterPlane);

    // 2. Giant Curved Ancient Roots (Dry elevated walkways, silent walking!)
    const rootConfigs = [
      { start: new THREE.Vector3(-4, 0.6, -4), end: new THREE.Vector3(2, 1.2, 8), radius: 0.7 },
      { start: new THREE.Vector3(2, 1.2, 8), end: new THREE.Vector3(-3, 1.4, 20), radius: 0.8 },
      { start: new THREE.Vector3(-3, 1.4, 20), end: new THREE.Vector3(4, 1.1, 32), radius: 0.75 },
      { start: new THREE.Vector3(4, 1.1, 32), end: new THREE.Vector3(0, 1.3, 44), radius: 0.8 }
    ];

    rootConfigs.forEach((cfg, idx) => {
      const curve = new THREE.LineCurve3(cfg.start, cfg.end);
      const tubeGeom = new THREE.TubeGeometry(curve, 16, cfg.radius, 8, false);
      const rootMesh = new THREE.Mesh(tubeGeom, rootMat);
      rootMesh.castShadow = true;
      rootMesh.receiveShadow = true;
      rootMesh.userData = { surface: 'wood' };
      this.group.add(rootMesh);
      this.groundMeshes.push(rootMesh);
    });

    // 3. Huge Ancient Tree Trunks (Block vision and form boundaries)
    const treePositions = [
      { x: -10, z: 5 }, { x: 10, z: 12 },
      { x: -11, z: 28 }, { x: 11, z: 35 },
      { x: -9, z: 48 }, { x: 8, z: 50 }
    ];

    treePositions.forEach(pos => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 24, 10), rootMat);
      trunk.position.set(pos.x, 11, pos.z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      this.group.add(trunk);
      this.wallMeshes.push(trunk);
    });

    // 4. Anchor Checkpoint 3 (On a stone islet surrounded by roots)
    const isletGeom = new THREE.CylinderGeometry(3.5, 4.2, 1.8, 8);
    const islet = new THREE.Mesh(isletGeom, rootMat);
    islet.position.set(0, 0.4, 22);
    islet.receiveShadow = true;
    islet.userData = { surface: 'stone' };
    this.group.add(islet);
    this.groundMeshes.push(islet);

    const anchor3 = new Anchor('anchor-drowned-forest-1', new THREE.Vector3(0, 1.3, 22), this.id);
    this.group.add(anchor3.group);
    this.anchors.push(anchor3);

    // 5. Memory Relic 1: Rusted Music Cylinder (hidden on high twisted branch)
    const memoryMusic = new MemoryFragment('memory-musicbox', new THREE.Vector3(-4.5, 2.2, 16));
    this.group.add(memoryMusic.group);
    this.memories.push(memoryMusic);

    // Memory Relic 2: Indigo Cloth Ribbon (tied to an old stone marker)
    const memoryRibbon = new MemoryFragment('memory-fabric', new THREE.Vector3(5.2, 1.6, 38));
    this.group.add(memoryRibbon.group);
    this.memories.push(memoryRibbon);

    // 6. Sluice Gate Mechanism: Ancient Iron Valve
    const valveStand = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 8), rootMat);
    valveStand.position.set(3.2, 1.3, 44);
    const valveWheel = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 6, 12), new THREE.MeshStandardMaterial({ color: 0x4a5a54, metalness: 0.7 }));
    valveWheel.position.set(3.2, 2.0, 44);
    valveWheel.rotation.x = Math.PI * 0.5;
    this.group.add(valveStand, valveWheel);

    // Submerged Drainage Gate Door
    const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 1.5), rootMat);
    gateDoor.position.set(0, 2.0, 50);
    this.group.add(gateDoor);
    this.wallMeshes.push(gateDoor);

    this.puzzle.registerInteractable({
      id: 'valve-forest-sluice',
      type: 'valve',
      position: new THREE.Vector3(3.2, 1.3, 44),
      interactRadius: 2.2,
      wheelMesh: valveWheel,
      rotations: 0,
      targetObject: {
        onDrain: () => {
          gateDoor.position.y = -3.5; // Sinks down to clear passage
        }
      }
    });

    // Exit portal to Silent Railway
    this.puzzle.registerInteractable({
      id: 'gate-drowned-forest',
      type: 'gate_portal',
      position: this.exitTriggerPos,
      interactRadius: 3.5,
      promptText: 'Enter the Silent Railway',
      isResolved: false
    });

    // 7. Enemy: Crawling Shape stalking in the water
    this.mirajEntity = new Miraj(MIRAJ_FORMS.CRAWLING_SHAPE);
    this.mirajEntity.group.position.set(4, 0.4, 28);
    this.group.add(this.mirajEntity.group);

    this.mirajAI = new MirajAI(this.mirajEntity, this.collision);
    this.mirajAI.teleport(new THREE.Vector3(4, 0.4, 28), Math.PI);
    this.mirajAI.state = AI_STATES.WATCHING;
    this.mirajAI.setWaypoints([
      new THREE.Vector3(4, 0.4, 18),
      new THREE.Vector3(-4, 0.4, 34)
    ]);
    this.mirajAI.setSanctuaries(this.anchors);

    this.collision.setColliders(this.groundMeshes, this.wallMeshes);
  }

  update(delta, playerPos, playerSpeed, isCrouching, isRunning, isGrounded) {
    this.anchors.forEach(a => a.update(delta));
    this.memories.forEach(m => m.update(delta));

    if (this.mirajAI) {
      this.mirajAI.update(delta, playerPos, playerSpeed, isCrouching, isRunning, isGrounded);
    }
  }

  cleanup() {
    this.scene.remove(this.group);
  }
}

export default DrownedForest;
