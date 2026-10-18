/**
 * MirajAI.js - Intelligent Enemy State Machine
 * Handles perception (vision cone, sound hearing), suspicion meter,
 * line-of-sight occlusion, Anchor safe zones, pursuit, and death triggers.
 */

import * as THREE from 'three';
import { audioManager } from './AudioManager.js';

export const AI_STATES = {
  DORMANT: 'DORMANT',
  WATCHING: 'WATCHING',
  INVESTIGATING: 'INVESTIGATING',
  SEARCHING: 'SEARCHING',
  HUNTING: 'HUNTING',
  DECEIVING: 'DECEIVING',
  RETREATING: 'RETREATING',
  CINEMATIC: 'CINEMATIC'
};

export class MirajAI {
  constructor(mirajEntity, collisionManager) {
    this.entity = mirajEntity;
    this.collision = collisionManager;

    this.state = AI_STATES.DORMANT;
    this.position = new THREE.Vector3(0, 0, 0);
    this.facingAngle = 0;

    // Perception parameters
    this.visionRange = 16.0;
    this.visionFov = Math.PI * 0.42; // ~75 degrees
    this.hearingRangeRun = 14.0;
    this.hearingRangeWalk = 6.0;
    this.hearingRangeCrouch = 1.4;

    // Movement speeds
    this.patrolSpeed = 2.2;
    this.chaseSpeed = 5.8;

    // Suspicion meter (0 to 100)
    this.suspicion = 0;
    this.targetInvestigatePos = new THREE.Vector3();
    this.patrolWaypoints = [];
    this.currentWaypointIndex = 0;

    // Safe sanctuaries (Anchors)
    this.sanctuaries = [];

    // Timers
    this.stateTimer = 0;
    this.searchTimer = 0;
    this.onPlayerCaughtCallback = null;

    // Raycaster for occlusion
    this.raycaster = new THREE.Raycaster();
  }

  setWaypoints(points) {
    this.patrolWaypoints = points || [];
    this.currentWaypointIndex = 0;
  }

  setSanctuaries(anchors) {
    this.sanctuaries = anchors || [];
  }

  onPlayerCaught(callback) {
    this.onPlayerCaughtCallback = callback;
  }

  teleport(pos, facing = 0) {
    this.position.copy(pos);
    this.facingAngle = facing;
    this.entity.group.position.copy(pos);
    this.entity.group.rotation.y = facing;
  }

  update(delta, playerPos, playerSpeed, isCrouching, isRunning, isGrounded) {
    if (this.state === AI_STATES.DORMANT) {
      audioManager.setTension(0);
      return;
    }

    this.stateTimer += delta;

    // 1. Check if player is inside an active Anchor sanctuary
    let inSanctuary = false;
    for (const anchor of this.sanctuaries) {
      if (anchor.isActivated && anchor.group.position.distanceTo(playerPos) < anchor.sanctuaryRadius) {
        inSanctuary = true;
        break;
      }
    }

    const distToPlayer = this.position.distanceTo(playerPos);

    // 2. Perception: Vision and Hearing
    let detectedThisFrame = false;

    if (!inSanctuary) {
      // Hearing check
      let hearRadius = isCrouching ? this.hearingRangeCrouch : (isRunning ? this.hearingRangeRun : this.hearingRangeWalk);
      if (playerSpeed < 0.2) hearRadius = 0.5;

      const heard = distToPlayer <= hearRadius && isGrounded && playerSpeed > 0.3;

      // Vision check
      let seen = false;
      const effectiveVisionRange = isCrouching ? 6.0 : this.visionRange;
      if (distToPlayer <= effectiveVisionRange) {
        // Angle check
        const dirToPlayer = playerPos.clone().sub(this.position);
        dirToPlayer.y = 0;
        dirToPlayer.normalize();

        const facingDir = new THREE.Vector3(Math.sin(this.facingAngle), 0, Math.cos(this.facingAngle));
        const angle = facingDir.angleTo(dirToPlayer);

        if (angle <= this.visionFov * 0.5) {
          // Line of Sight check
          const rayOrigin = this.position.clone().add(new THREE.Vector3(0, 1.2, 0));
          const rayTarget = playerPos.clone().add(new THREE.Vector3(0, 0.6, 0));
          const rayDir = rayTarget.clone().sub(rayOrigin).normalize();

          this.raycaster.set(rayOrigin, rayDir);
          this.raycaster.far = distToPlayer + 0.2;

          const hits = this.raycaster.intersectObjects(this.collision.wallColliders, true);
          if (hits.length === 0 || hits[0].distance >= distToPlayer - 0.3) {
            seen = true;
          }
        }
      }

      detectedThisFrame = seen || heard;
    }

    // 3. Update Suspicion
    if (detectedThisFrame) {
      this.targetInvestigatePos.copy(playerPos);
      const rate = inSanctuary ? -40 : (this.state === AI_STATES.HUNTING ? 25 : 45);
      this.suspicion = Math.min(100, this.suspicion + rate * delta);
    } else {
      const decay = this.state === AI_STATES.HUNTING ? 12 : 22;
      this.suspicion = Math.max(0, this.suspicion - decay * delta);
    }

    // 4. Update Tension in AudioManager
    const normalizedTension = this.suspicion / 100.0;
    audioManager.setTension(normalizedTension);

    // 5. State Machine Transitions
    if (inSanctuary && this.state === AI_STATES.HUNTING) {
      this.state = AI_STATES.RETREATING;
      this.stateTimer = 0;
    } else if (this.suspicion >= 95 && this.state !== AI_STATES.HUNTING && !inSanctuary) {
      this.state = AI_STATES.HUNTING;
      this.stateTimer = 0;
    } else if (this.suspicion >= 25 && this.state === AI_STATES.WATCHING) {
      this.state = AI_STATES.INVESTIGATING;
      this.stateTimer = 0;
    } else if (this.suspicion <= 10 && this.state === AI_STATES.HUNTING) {
      this.state = AI_STATES.SEARCHING;
      this.searchTimer = 4.0;
    }

    // 6. State Behavior Execution
    switch (this.state) {
      case AI_STATES.WATCHING:
        // Silently observe player from a distance
        this.faceTowards(playerPos, delta * 3.0);
        break;

      case AI_STATES.INVESTIGATING:
        // Move cautiously toward last known noise/sight position
        this.moveTowards(this.targetInvestigatePos, this.patrolSpeed * 1.2, delta);
        if (this.position.distanceTo(this.targetInvestigatePos) < 1.5) {
          this.state = AI_STATES.SEARCHING;
          this.searchTimer = 5.0;
        }
        break;

      case AI_STATES.SEARCHING:
        // Look around suspiciously
        this.searchTimer -= delta;
        this.facingAngle += Math.sin(this.stateTimer * 2.5) * delta * 1.8;
        if (this.searchTimer <= 0) {
          this.state = AI_STATES.RETREATING;
          this.stateTimer = 0;
        }
        break;

      case AI_STATES.HUNTING:
        // Relentlessly chase player
        this.moveTowards(playerPos, this.chaseSpeed, delta);

        // Catch check
        if (distToPlayer <= 1.55 && !inSanctuary) {
          if (this.onPlayerCaughtCallback) {
            this.onPlayerCaughtCallback();
          }
        }
        break;

      case AI_STATES.RETREATING:
        // Retreat back toward patrol route or shadows
        if (this.patrolWaypoints.length > 0) {
          const wp = this.patrolWaypoints[0];
          this.moveTowards(wp, this.patrolSpeed, delta);
          if (this.position.distanceTo(wp) < 1.5) {
            this.state = AI_STATES.WATCHING;
          }
        } else {
          this.state = AI_STATES.WATCHING;
        }
        break;
    }

    // 7. Ground alignment
    const groundInfo = this.collision.checkGround(this.position, 0.4, 2.0);
    if (groundInfo.isGrounded) {
      this.position.y = groundInfo.groundY;
    }

    // Sync mesh
    this.entity.group.position.copy(this.position);
    this.entity.group.rotation.y = this.facingAngle;
    this.entity.update(delta, this.state);
  }

  moveTowards(targetPos, speed, delta) {
    const dir = targetPos.clone().sub(this.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.1) return;

    dir.normalize();
    this.faceTowards(targetPos, delta * 12.0);

    const step = dir.clone().multiplyScalar(speed * delta);
    this.position.add(step);
    this.position.copy(this.collision.resolveWallCollisions(this.position, 0.45, 1.8));
  }

  faceTowards(targetPos, turnRate) {
    const dir = targetPos.clone().sub(this.position);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) return;

    const targetAngle = Math.atan2(dir.x, dir.z);
    let diff = targetAngle - this.facingAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facingAngle += diff * Math.min(1.0, turnRate);
  }

  getSuspicion() {
    return this.suspicion;
  }

  getState() {
    return this.state;
  }
}

export default MirajAI;
