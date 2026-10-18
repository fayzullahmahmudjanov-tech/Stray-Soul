/**
 * AbandonedCity.js - Chapter 2: The Abandoned City
 * Ruined stone tenements, narrow streets, suspended catwalks,
 * moveable crate puzzle, patrolling Crawling Shape enemy,
 * Anchor checkpoint, memory relics, and transit lift mechanism.
 */

import * as THREE from 'three';
import { Anchor } from '../entities/Anchor.js';
import { MemoryFragment } from '../entities/MemoryFragment.js';
import { Miraj, MIRAJ_FORMS } from '../entities/Miraj.js';
import { MirajAI, AI_STATES } from '../game/MirajAI.js';

export class AbandonedCity {
  constructor(scene, collisionManager, puzzleManager) {
    this.id = 'abandoned-city';
    this.name = 'THE ABANDONED CITY';
    this.subtitle = 'Silent cobblestones beneath hollow towers';
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;

    this.group = new THREE.Group();
    this.group.name = 'Chapter_AbandonedCity';

    this.groundMeshes = [];
    this.wallMeshes = [];
    this.pushableBoxes = [];
    this.anchors = [];
    this.memories = [];
    this.mirajEntity = null;
    this.mirajAI = null;

    this.spawnPoint = { x: 0, y: 1.0, z: -5 };
    this.exitTriggerPos = new THREE.Vector3(0, 7.5, 48);

    this.init();
  }

  init() {
    this.scene.add(this.group);

    // Fog & Lighting: Desolate charcoal slate rain mist
    this.scene.fog = new THREE.FogExp2(0x11161f, 0.032);

    const dirLight = new THREE.DirectionalLight(0x8fa4b8, 1.0);
    dirLight.position.set(-20, 35, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.group.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x18202c, 1.2);
    this.group.add(ambLight);

    this.buildGeometry();
  }

  buildGeometry() {
    const streetMat = new THREE.MeshStandardMaterial({
      color: 0x1a212b,
      roughness: 0.8,
      metalness: 0.1
    });

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x242e3d,
      roughness: 0.9,
      metalness: 0.05
    });

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x1f2329,
      roughness: 0.4,
      metalness: 0.7
    });

    // 1. Main Street Alley Floor
    const streetGeom = new THREE.BoxGeometry(16, 2, 60);
    const street = new THREE.Mesh(streetGeom, streetMat);
    street.position.set(0, -1.0, 20);
    street.receiveShadow = true;
    street.userData = { surface: 'stone' };
    this.group.add(street);
    this.groundMeshes.push(street);

    // 2. Ruined Tenement Buildings Flanking Both Sides
    const buildingHeights = [14, 18, 12, 16];
    for (let i = 0; i < 4; i++) {
      const zPos = i * 14;
      const hL = buildingHeights[i];
      const hR = buildingHeights[(i + 2) % 4];

      // Left building
      const bL = new THREE.Mesh(new THREE.BoxGeometry(10, hL, 12), buildingMat);
      bL.position.set(-13, hL * 0.5 - 1.0, zPos);
      bL.castShadow = true;
      bL.receiveShadow = true;
      this.group.add(bL);
      this.wallMeshes.push(bL);

      // Right building
      const bR = new THREE.Mesh(new THREE.BoxGeometry(10, hR, 12), buildingMat);
      bR.position.set(13, hR * 0.5 - 1.0, zPos);
      bR.castShadow = true;
      bR.receiveShadow = true;
      this.group.add(bR);
      this.wallMeshes.push(bR);
    }

    // 3. Moveable Wooden Crate Puzzle (Player must push this box to reach the fire escape)
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x5a4430,
      roughness: 0.75,
      metalness: 0.1
    });
    const crateGeom = new THREE.BoxGeometry(1.6, 1.4, 1.6);
    const crate = new THREE.Mesh(crateGeom, crateMat);
    crate.position.set(3.5, 0.7, 8);
    crate.castShadow = true;
    crate.receiveShadow = true;
    crate.userData = { halfHeight: 0.7, surface: 'wood' };
    this.group.add(crate);
    this.groundMeshes.push(crate);
    this.wallMeshes.push(crate);
    this.pushableBoxes.push(crate);

    // 4. Low Broken Fire Escape Platform (above the crate target)
    const fireEscapeGeom = new THREE.BoxGeometry(4.5, 0.4, 8);
    const fireEscape = new THREE.Mesh(fireEscapeGeom, ironMat);
    fireEscape.position.set(6.5, 2.8, 12);
    fireEscape.receiveShadow = true;
    fireEscape.userData = { surface: 'metal' };
    this.group.add(fireEscape);
    this.groundMeshes.push(fireEscape);
    this.wallMeshes.push(fireEscape);

    // 5. Suspended High Catwalk
    const catwalkGeom = new THREE.BoxGeometry(3.5, 0.4, 18);
    const catwalk = new THREE.Mesh(catwalkGeom, ironMat);
    catwalk.position.set(0, 6.5, 30);
    catwalk.receiveShadow = true;
    catwalk.userData = { surface: 'metal' };
    this.group.add(catwalk);
    this.groundMeshes.push(catwalk);

    // 6. Anchor Checkpoint 2 (Located safely on the high catwalk)
    const anchor2 = new Anchor('anchor-abandoned-city-1', new THREE.Vector3(0, 6.7, 28), this.id);
    this.group.add(anchor2.group);
    this.anchors.push(anchor2);

    // 7. Memory Relic 1: Small Wooden Sparrow (hidden in an alley nook)
    const memoryBird = new MemoryFragment('memory-bird', new THREE.Vector3(-6.2, 0.8, 14));
    this.group.add(memoryBird.group);
    this.memories.push(memoryBird);

    // Memory Relic 2: Weathered Brass Bell (on high catwalk)
    const memoryBell = new MemoryFragment('memory-bell', new THREE.Vector3(0, 7.3, 36));
    this.group.add(memoryBell.group);
    this.memories.push(memoryBell);

    // 8. Mechanism Switch: High Water Tower Lever
    // Pulling this lever lowers the suspended transit platform to exit
    const leverStand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8), ironMat);
    leverStand.position.set(1.4, 7.1, 32);
    const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0xcc8833 }));
    leverHandle.position.set(1.4, 7.5, 32);
    leverHandle.rotation.z = -0.5;
    this.group.add(leverStand, leverHandle);

    // Suspended Transit Gate
    const transitGateGeom = new THREE.BoxGeometry(6, 1.0, 6);
    const transitPlatform = new THREE.Mesh(transitGateGeom, ironMat);
    transitPlatform.position.set(0, 2.0, 48); // Starts lowered
    transitPlatform.receiveShadow = true;
    transitPlatform.userData = { surface: 'metal' };
    this.group.add(transitPlatform);
    this.groundMeshes.push(transitPlatform);

    this.puzzle.registerInteractable({
      id: 'lever-city-lift',
      type: 'switch',
      position: new THREE.Vector3(1.4, 7.1, 32),
      interactRadius: 2.2,
      handleMesh: leverHandle,
      state: false,
      message: 'The suspended transit platform rises into place!',
      targetObject: {
        type: 'bridge',
        mesh: transitPlatform,
        targetY: 6.8,
        isLowered: false
      }
    });

    // Exit portal to Drowned Forest
    this.puzzle.registerInteractable({
      id: 'gate-abandoned-city',
      type: 'gate_portal',
      position: this.exitTriggerPos,
      interactRadius: 3.5,
      promptText: 'Descend into the Drowned Forest',
      isResolved: false
    });

    // 9. Enemy: The Crawling Shape patrolling the lower street
    this.mirajEntity = new Miraj(MIRAJ_FORMS.CRAWLING_SHAPE);
    this.mirajEntity.group.position.set(0, 0.5, 16);
    this.group.add(this.mirajEntity.group);

    this.mirajAI = new MirajAI(this.mirajEntity, this.collision);
    this.mirajAI.teleport(new THREE.Vector3(0, 0.5, 16), 0);
    this.mirajAI.state = AI_STATES.WATCHING;
    this.mirajAI.setWaypoints([
      new THREE.Vector3(0, 0.5, 12),
      new THREE.Vector3(0, 0.5, 24)
    ]);
    this.mirajAI.setSanctuaries(this.anchors);

    // Register colliders
    this.collision.setColliders(this.groundMeshes, this.wallMeshes, this.pushableBoxes);
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

export default AbandonedCity;
