/**
 * PlayerController.js - Third-person physics controller
 * Camera-relative movement, slope handling, coyote time, jump buffering,
 * ledge climbing/mantling, pushable crate interactions, and footstep audio.
 */

import * as THREE from 'three';
import { audioManager } from './AudioManager.js';

export class PlayerController {
  constructor(straySoul, cameraController, collisionManager) {
    this.soul = straySoul;
    this.camera = cameraController;
    this.collision = collisionManager;

    this.position = new THREE.Vector3(0, 1.5, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Speed configuration
    this.walkSpeed = 3.8;
    this.runSpeed = 7.2;
    this.crouchSpeed = 1.9;
    this.jumpForce = 6.4;
    this.gravity = -18.5;

    // Movement states
    this.isGrounded = false;
    this.isRunning = false;
    this.isCrouching = false;
    this.facingAngle = 0;

    // Coyote time and jump buffering
    this.coyoteTimer = 0;
    this.coyoteDuration = 0.15;
    this.jumpBufferTimer = 0;
    this.jumpBufferDuration = 0.12;

    // Ledge climbing state
    this.isClimbing = false;
    this.climbProgress = 0;
    this.climbStartPos = new THREE.Vector3();
    this.climbTargetPos = new THREE.Vector3();

    // Footstep audio timing
    this.stepDistanceCounter = 0;

    // Sync initial position
    this.position.copy(this.soul.getPosition());
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.soul.setPosition(x, y, z);
    this.camera.setTarget(this.position);
  }

  update(delta, inputManager) {
    if (this.soul.isDead) return;

    // 1. Handle Ledge Climbing Animation
    if (this.isClimbing) {
      this.climbProgress += delta * 2.5;
      if (this.climbProgress >= 1.0) {
        this.position.copy(this.climbTargetPos);
        this.velocity.set(0, 0, 0);
        this.isClimbing = false;
      } else {
        // Smooth curved mantle path (up then forward)
        const t = this.climbProgress;
        const ease = t * (2 - t);
        this.position.lerpVectors(this.climbStartPos, this.climbTargetPos, ease);
      }
      this.soul.setPosition(this.position.x, this.position.y, this.position.z);
      this.camera.setTarget(this.position);
      return;
    }

    // 2. Read Inputs
    const moveInput = inputManager.getMovementVector();
    this.isRunning = inputManager.isRunning() && !this.isCrouching && moveInput.z < -0.1;
    this.isCrouching = inputManager.isCrouching();

    // Lantern focus
    const focusRequested = inputManager.isLanternFocused();
    this.soul.setLanternFocus(focusRequested);

    // 3. Jump buffering & Coyote time
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteDuration;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    if (inputManager.isJumping()) {
      this.jumpBufferTimer = this.jumpBufferDuration;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // Perform Jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isCrouching) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      audioManager.playJump();
    }

    // 4. Calculate Camera-Relative Movement
    let targetSpeed = this.walkSpeed;
    if (this.isRunning) targetSpeed = this.runSpeed;
    else if (this.isCrouching) targetSpeed = this.crouchSpeed;

    const camForward = this.camera.getForwardDirection();
    const camRight = this.camera.getRightDirection();

    const desiredMove = new THREE.Vector3();
    desiredMove.addScaledVector(camForward, -moveInput.z);
    desiredMove.addScaledVector(camRight, moveInput.x);

    if (desiredMove.lengthSq() > 0.01) {
      desiredMove.normalize();
      // Rotate character to face movement direction
      const targetAngle = Math.atan2(desiredMove.x, desiredMove.z);
      // Smooth angle interpolation
      let angleDiff = targetAngle - this.facingAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.facingAngle += angleDiff * Math.min(1.0, delta * 14);
      this.soul.group.rotation.y = this.facingAngle;
    }

    // Horizontal acceleration & friction
    const accel = this.isGrounded ? 22.0 : 7.0;
    const targetVelX = desiredMove.x * targetSpeed;
    const targetVelZ = desiredMove.z * targetSpeed;

    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, delta * accel);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, delta * accel);

    // Apply Gravity
    this.velocity.y += this.gravity * delta;
    this.velocity.y = Math.max(-28.0, this.velocity.y);

    // 5. Integrate Position
    const moveStep = new THREE.Vector3(
      this.velocity.x * delta,
      this.velocity.y * delta,
      this.velocity.z * delta
    );

    const prevPos = this.position.clone();
    this.position.add(moveStep);

    // 6. Wall Collisions & Sliding
    this.position.copy(this.collision.resolveWallCollisions(this.position, 0.35, 1.2));

    // Dynamic pushable objects
    this.collision.tryPushObject(this.position, new THREE.Vector3(this.velocity.x, 0, this.velocity.z), delta);

    // 7. Check Ledge Climb / Mantle
    if (!this.isGrounded && this.velocity.y < 2.0 && desiredMove.lengthSq() > 0.1) {
      const climbCheck = this.collision.checkLedgeClimb(this.position, desiredMove, this.facingAngle);
      if (climbCheck && climbCheck.canClimb) {
        this.isClimbing = true;
        this.climbProgress = 0;
        this.climbStartPos.copy(this.position);
        this.climbTargetPos.copy(climbCheck.mantlePoint);
        return;
      }
    }

    // 8. Ground Raycast & Snapping
    const groundInfo = this.collision.checkGround(this.position, 0.45, 1.3);
    const wasGrounded = this.isGrounded;

    if (groundInfo.isGrounded && this.velocity.y <= 0.05) {
      this.isGrounded = true;
      this.position.y = groundInfo.groundY;
      this.velocity.y = 0;

      if (!wasGrounded) {
        audioManager.playLand();
      }
    } else {
      this.isGrounded = false;
    }

    // 9. Footstep Audio
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (this.isGrounded && horizontalSpeed > 0.3) {
      this.stepDistanceCounter += horizontalSpeed * delta;
      const stepInterval = this.isRunning ? 2.1 : 1.35;
      if (this.stepDistanceCounter >= stepInterval) {
        this.stepDistanceCounter = 0;
        audioManager.playFootstep(groundInfo.surfaceType, this.isCrouching);
      }
    }

    // 10. Sync StraySoul Visuals and Camera Target
    this.soul.setPosition(this.position.x, this.position.y, this.position.z);
    this.soul.updateAnimation(
      delta,
      horizontalSpeed,
      this.isGrounded,
      this.isCrouching,
      this.isRunning
    );

    this.camera.setTarget(this.position);
  }

  getHorizontalSpeed() {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
  }
}

export default PlayerController;
