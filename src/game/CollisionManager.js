/**
 * CollisionManager.js - Raycast ground detection, swept sphere obstacle resolution,
 * ledge climbing detection, dynamic pushable boxes, and void recovery.
 */

import * as THREE from 'three';

export class CollisionManager {
  constructor() {
    this.groundColliders = [];
    this.wallColliders = [];
    this.pushableObjects = [];

    this.downRay = new THREE.Raycaster();
    this.downRay.ray.direction.set(0, -1, 0);

    this.forwardRay = new THREE.Raycaster();
    this.ledgeTopRay = new THREE.Raycaster();
    this.ledgeTopRay.ray.direction.set(0, -1, 0);

    this.tempVec1 = new THREE.Vector3();
    this.tempVec2 = new THREE.Vector3();
  }

  setColliders(groundMeshes, wallMeshes = [], pushables = []) {
    this.groundColliders = groundMeshes || [];
    this.wallColliders = wallMeshes || [];
    this.pushableObjects = pushables || [];
  }

  addCollider(mesh, isWall = false) {
    if (isWall) {
      if (!this.wallColliders.includes(mesh)) this.wallColliders.push(mesh);
    } else {
      if (!this.groundColliders.includes(mesh)) this.groundColliders.push(mesh);
    }
  }

  addPushable(box) {
    if (!this.pushableObjects.includes(box)) {
      this.pushableObjects.push(box);
    }
  }

  /**
   * Ground check: casts down from slightly above feet.
   * Returns: { isGrounded, groundY, surfaceNormal, surfaceType }
   */
  checkGround(position, footOffset = 0.4, maxDistance = 1.2) {
    const origin = this.tempVec1.set(position.x, position.y + footOffset, position.z);
    this.downRay.ray.origin.copy(origin);
    this.downRay.far = maxDistance;

    const allFloorCandidates = [...this.groundColliders, ...this.pushableObjects];
    const hits = this.downRay.intersectObjects(allFloorCandidates, true);

    if (hits.length > 0) {
      const hit = hits[0];
      const groundY = hit.point.y;
      const dist = hit.distance;
      const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
      const isGrounded = dist <= footOffset + 0.12;

      // Surface detection by user data or material name
      let surfaceType = 'stone';
      if (hit.object.userData && hit.object.userData.surface) {
        surfaceType = hit.object.userData.surface;
      }

      return {
        isGrounded,
        groundY,
        distance: dist,
        surfaceNormal: normal,
        surfaceType
      };
    }

    return {
      isGrounded: false,
      groundY: -999,
      distance: Infinity,
      surfaceNormal: new THREE.Vector3(0, 1, 0),
      surfaceType: 'stone'
    };
  }

  /**
   * Wall Collision & Sliding: checks if new position intersects any wall or pushable
   * Returns corrected position.
   */
  resolveWallCollisions(position, radius = 0.35, height = 1.2) {
    const correctedPos = position.clone();
    const checkLayers = [0.3, height * 0.5, height * 0.85];
    const numDirections = 8;
    const allWalls = [...this.wallColliders, ...this.pushableObjects];

    if (allWalls.length === 0) return correctedPos;

    for (const h of checkLayers) {
      const origin = new THREE.Vector3(correctedPos.x, correctedPos.y + h, correctedPos.z);

      for (let i = 0; i < numDirections; i++) {
        const angle = (i / numDirections) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

        this.forwardRay.set(origin, dir);
        this.forwardRay.far = radius + 0.15;

        const hits = this.forwardRay.intersectObjects(allWalls, true);
        if (hits.length > 0) {
          const hit = hits[0];
          const penetration = (radius + 0.05) - hit.distance;
          if (penetration > 0) {
            // Push position away from wall normal
            const pushDir = hit.face ? hit.face.normal.clone() : dir.clone().negate();
            pushDir.y = 0;
            pushDir.normalize();
            correctedPos.addScaledVector(pushDir, penetration);
          }
        }
      }
    }

    return correctedPos;
  }

  /**
   * Ledge Climb / Mantle Detection:
   * When moving forward into an obstacle of height between 0.8m and 1.8m,
   * detects if top surface is walkable.
   * Returns { canClimb, ledgeTopY, mantlePoint } or null
   */
  checkLedgeClimb(position, moveDir, facingAngle) {
    if (moveDir.lengthSq() < 0.01) return null;

    const dir = new THREE.Vector3(Math.sin(facingAngle), 0, Math.cos(facingAngle)).normalize();
    const chestPos = position.clone().add(new THREE.Vector3(0, 0.9, 0));

    this.forwardRay.set(chestPos, dir);
    this.forwardRay.far = 0.85;

    const wallHits = this.forwardRay.intersectObjects(this.wallColliders, true);
    if (wallHits.length > 0) {
      const hitDist = wallHits[0].distance;
      // Cast down ahead of wall to see if top is clear
      const checkAboveOrigin = position.clone()
        .addScaledVector(dir, hitDist + 0.35)
        .add(new THREE.Vector3(0, 2.2, 0));

      this.ledgeTopRay.ray.origin.copy(checkAboveOrigin);
      this.ledgeTopRay.far = 2.4;

      const topHits = this.ledgeTopRay.intersectObjects(this.groundColliders, true);
      if (topHits.length > 0) {
        const topY = topHits[0].point.y;
        const heightDiff = topY - position.y;
        if (heightDiff >= 0.7 && heightDiff <= 1.9) {
          return {
            canClimb: true,
            ledgeTopY: topY,
            mantlePoint: topHits[0].point.clone().add(new THREE.Vector3(0, 0.05, 0))
          };
        }
      }
    }

    return null;
  }

  /**
   * Dynamic Crate Push:
   * Allows pushing moveable boxes when walking against them.
   */
  tryPushObject(position, moveVector, delta) {
    if (this.pushableObjects.length === 0 || moveVector.lengthSq() < 0.01) return;

    const pushForce = 2.4;
    for (const obj of this.pushableObjects) {
      const boxPos = obj.position;
      const dist = position.distanceTo(boxPos);
      if (dist < 1.4) {
        // Player is adjacent, apply push in moveVector direction
        const dir = moveVector.clone().normalize();
        obj.position.x += dir.x * pushForce * delta;
        obj.position.z += dir.z * pushForce * delta;

        // Also check ground for pushed box
        const origin = new THREE.Vector3(obj.position.x, obj.position.y + 1, obj.position.z);
        this.downRay.ray.origin.copy(origin);
        this.downRay.far = 3.0;
        const hits = this.downRay.intersectObjects(this.groundColliders, true);
        if (hits.length > 0) {
          obj.position.y = hits[0].point.y + (obj.userData.halfHeight || 0.5);
        }
      }
    }
  }
}

export default CollisionManager;
