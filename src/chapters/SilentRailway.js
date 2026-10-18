/**
 * SilentRailway.js - Chapter 4: The Silent Railway
 * Cavernous underground locomotive tracks, rusted train platforms,
 * mechanical track switch puzzle, high-stakes tunnel pursuit sequence,
 * Anchor checkpoint, and elevator shaft to the clouds.
 */

import * as THREE from 'three';
import { Anchor } from '../entities/Anchor.js';
import { MemoryFragment } from '../entities/MemoryFragment.js';
import { Miraj, MIRAJ_FORMS } from '../entities/Miraj.js';
import { MirajAI, AI_STATES } from '../game/MirajAI.js';

export class SilentRailway {
  constructor(scene, collisionManager, puzzleManager) {
    this.id = 'silent-railway';
    this.name = 'THE SILENT RAILWAY';
    this.subtitle = 'Rusted tracks suspended over cavernous darkness';
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;

    this.group = new THREE.Group();
    this.group.name = 'Chapter_SilentRailway';

    this.groundMeshes = [];
    this.wallMeshes = [];
    this.anchors = [];
    this.memories = [];
    this.mirajEntity = null;
    this.mirajAI = null;

    this.spawnPoint = { x: 0, y: 1.2, z: -8 };
    this.exitTriggerPos = new THREE.Vector3(0, 3.2, 58);

    this.init();
  }

  init() {
    this.scene.add(this.group);

    // Fog & Lighting: Subterranean deep iron cavern haze
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.038);

    const dirLight = new THREE.DirectionalLight(0xd49b55, 0.7);
    dirLight.position.set(0, 25, 20);
    this.group.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x11161d, 1.2);
    this.group.add(ambLight);

    this.buildGeometry();
  }

  buildGeometry() {
    const cavernStoneMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      roughness: 0.9,
      metalness: 0.15
    });

    const ironRustMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.7,
      metalness: 0.6
    });

    const trainCarMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.6,
      metalness: 0.5
    });

    // 1. Entrance Station Platform
    const stationGeom = new THREE.BoxGeometry(12, 2, 20);
    const station = new THREE.Mesh(stationGeom, cavernStoneMat);
    station.position.set(0, -1.0, 0);
    station.receiveShadow = true;
    station.userData = { surface: 'stone' };
    this.group.add(station);
    this.groundMeshes.push(station);

    // Cavern Enclosure Walls
    [-7, 7].forEach(x => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 70), cavernStoneMat);
      wall.position.set(x, 6, 25);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);
      this.wallMeshes.push(wall);
    });

    // 2. Chasm Gap with Suspended Railway Tracks
    const chasmGapStart = 10;
    const chasmGapEnd = 36;

    // Left and Right Rail Beams
    [-1.2, 1.2].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 26), ironRustMat);
      rail.position.set(x, 0.15, 23);
      rail.userData = { surface: 'metal' };
      this.group.add(rail);
      this.groundMeshes.push(rail);
    });

    // 3. Moveable Rusted Train Carriage (Puzzle Object)
    // Initially pushed away; track switch rolls it into place as a bridge!
    const trainCarGeom = new THREE.BoxGeometry(3.6, 2.6, 9.0);
    const trainCar = new THREE.Mesh(trainCarGeom, trainCarMat);
    trainCar.position.set(0, 1.3, 14); // Starts blocking or bridging
    trainCar.castShadow = true;
    trainCar.receiveShadow = true;
    trainCar.userData = { surface: 'metal' };
    this.group.add(trainCar);
    this.groundMeshes.push(trainCar);
    this.wallMeshes.push(trainCar);

    // 4. Far Station Platform
    const farPlatformGeom = new THREE.BoxGeometry(12, 2, 24);
    const farPlatform = new THREE.Mesh(farPlatformGeom, cavernStoneMat);
    farPlatform.position.set(0, -1.0, 48);
    farPlatform.receiveShadow = true;
    farPlatform.userData = { surface: 'stone' };
    this.group.add(farPlatform);
    this.groundMeshes.push(farPlatform);

    // 5. Anchor Checkpoint 4 (On the far platform)
    const anchor4 = new Anchor('anchor-silent-railway-1', new THREE.Vector3(0, 0.0, 42), this.id);
    this.group.add(anchor4.group);
    this.anchors.push(anchor4);

    // 6. Memory Relic 1: Frozen Pocket Watch (Inside an old conductor booth)
    const memoryWatch = new MemoryFragment('memory-pocketwatch', new THREE.Vector3(-4.0, 1.2, 6));
    this.group.add(memoryWatch.group);
    this.memories.push(memoryWatch);

    // Memory Relic 2: Faded Railway Token (On the far train buffer)
    const memoryTicket = new MemoryFragment('memory-ticket', new THREE.Vector3(3.8, 1.2, 49));
    this.group.add(memoryTicket.group);
    this.memories.push(memoryTicket);

    // 7. Railway Track Switch Lever
    const leverStand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8), ironRustMat);
    leverStand.position.set(-3.5, 0.6, 8);
    const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0xcc8833 }));
    leverHandle.position.set(-3.5, 1.0, 8);
    leverHandle.rotation.z = -0.5;
    this.group.add(leverStand, leverHandle);

    this.puzzle.registerInteractable({
      id: 'lever-rail-switch',
      type: 'switch',
      position: new THREE.Vector3(-3.5, 0.6, 8),
      interactRadius: 2.2,
      handleMesh: leverHandle,
      state: false,
      message: 'The track switches lock. The railcar slides into position across the chasm!',
      targetObject: {
        type: 'bridge',
        mesh: trainCar,
        targetY: 1.3,
        isLowered: true
      }
    });

    // Exit portal: Vertical Mountain Elevator Shaft to Chapter 5
    this.puzzle.registerInteractable({
      id: 'gate-silent-railway',
      type: 'gate_portal',
      position: this.exitTriggerPos,
      interactRadius: 3.5,
      promptText: 'Ascend to the City Above the Clouds',
      isResolved: false
    });

    // 8. Miraj Manifestation: The Unfinished (Flickering pursuit stalker)
    this.mirajEntity = new Miraj(MIRAJ_FORMS.UNFINISHED);
    this.mirajEntity.group.position.set(0, 0.5, 2);
    this.group.add(this.mirajEntity.group);

    this.mirajAI = new MirajAI(this.mirajEntity, this.collision);
    this.mirajAI.teleport(new THREE.Vector3(0, 0.5, 2), 0);
    this.mirajAI.state = AI_STATES.WATCHING;
    this.mirajAI.setWaypoints([
      new THREE.Vector3(0, 0.5, 2),
      new THREE.Vector3(0, 0.5, 22)
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

export default SilentRailway;
