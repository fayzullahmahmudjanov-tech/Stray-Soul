/**
 * CameraController.js - Smooth third-person orbital camera with collision avoidance,
 * pitch/yaw clamping, target damping, and trauma shake.
 */

import * as THREE from 'three';
import { saveManager } from './SaveManager.js';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.target = new THREE.Vector3(0, 1.2, 0);
    this.smoothedTarget = new THREE.Vector3(0, 1.2, 0);

    // Spherical angles
    this.yaw = 0; // horizontal rotation (radians)
    this.pitch = 0.25; // vertical angle (radians)

    // Distance configuration
    this.targetDistance = 4.5;
    this.currentDistance = 4.5;
    this.minDistance = 1.2;
    this.maxDistance = 7.0;

    // Pitch limits
    this.minPitch = -Math.PI * 0.15; // looking up from below
    this.maxPitch = Math.PI * 0.42;  // looking down from above

    // Damping and smoothing
    this.rotationDamping = 0.08;
    this.positionDamping = 0.12;

    // Camera Collision avoidance
    this.raycaster = new THREE.Raycaster();
    this.collisionObjects = [];

    // Screen Shake
    this.trauma = 0;
    this.shakeOffset = new THREE.Vector3();
  }

  setTarget(position) {
    this.target.copy(position);
  }

  setCollisionObjects(objects) {
    this.collisionObjects = objects || [];
  }

  addTrauma(amount) {
    if (!saveManager.settings.cameraShake) return;
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(delta, lookDelta, isCrouching = false, isRunning = false) {
    // Process look delta
    this.yaw -= lookDelta.x;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + lookDelta.y));

    // Dynamic distance adaptation
    let desiredDistance = 4.5;
    if (isCrouching) desiredDistance = 3.6;
    else if (isRunning) desiredDistance = 5.2;

    this.targetDistance = desiredDistance;

    // Smooth target follow
    this.smoothedTarget.lerp(this.target, 1.0 - Math.pow(0.001, delta));

    // Desired ideal position in spherical coords
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const dirX = sinYaw * cosPitch;
    const dirY = sinPitch;
    const dirZ = cosYaw * cosPitch;

    const idealCamPos = new THREE.Vector3(
      this.smoothedTarget.x + dirX * this.targetDistance,
      this.smoothedTarget.y + dirY * this.targetDistance + 0.3,
      this.smoothedTarget.z + dirZ * this.targetDistance
    );

    // Collision check against world geometry
    let effectiveDistance = this.targetDistance;
    if (this.collisionObjects.length > 0) {
      const origin = this.smoothedTarget.clone().add(new THREE.Vector3(0, 0.4, 0));
      const direction = idealCamPos.clone().sub(origin).normalize();
      this.raycaster.set(origin, direction);
      this.raycaster.far = this.targetDistance;

      const intersects = this.raycaster.intersectObjects(this.collisionObjects, true);
      if (intersects.length > 0) {
        // Pull camera in front of the wall
        effectiveDistance = Math.max(this.minDistance, intersects[0].distance - 0.25);
      }
    }

    // Smooth distance adjustment
    this.currentDistance += (effectiveDistance - this.currentDistance) * 0.2;

    // Apply final camera position
    this.camera.position.set(
      this.smoothedTarget.x + dirX * this.currentDistance,
      this.smoothedTarget.y + dirY * this.currentDistance + 0.3,
      this.smoothedTarget.z + dirZ * this.currentDistance
    );

    // Apply trauma shake if active
    if (this.trauma > 0.001) {
      const shakePower = this.trauma * this.trauma * 0.25;
      this.shakeOffset.set(
        (Math.random() * 2 - 1) * shakePower,
        (Math.random() * 2 - 1) * shakePower,
        (Math.random() * 2 - 1) * shakePower
      );
      this.camera.position.add(this.shakeOffset);
      this.trauma = Math.max(0, this.trauma - delta * 1.5);
    }

    // Camera looks at target point slightly above player feet
    const lookAtPoint = this.smoothedTarget.clone().add(new THREE.Vector3(0, 0.4, 0));
    this.camera.lookAt(lookAtPoint);
  }

  getForwardDirection() {
    // Camera forward projected on XZ plane
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  getRightDirection() {
    const forward = this.getForwardDirection();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    return right;
  }
}

export default CameraController;
