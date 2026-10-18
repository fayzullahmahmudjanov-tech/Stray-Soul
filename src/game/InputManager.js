/**
 * InputManager.js - Centralized Keyboard and Mouse Controller
 * Handles pointer lock, camera delta, movement axes, and contextual keys.
 */

import { saveManager } from './SaveManager.js';

export class InputManager {
  constructor() {
    this.keys = {};
    this.prevKeys = {};

    this.mouseDelta = { x: 0, y: 0 };
    this.isPointerLocked = false;
    this.isMouseDown = false;
    this.lastMousePos = { x: 0, y: 0 };

    this.domElement = null;
    this.enabled = true;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
  }

  init(domElement) {
    this.domElement = domElement || document.body;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mozpointerlockchange', this.onPointerLockChange);
  }

  requestPointerLock() {
    if (!this.enabled || !this.domElement) return;
    try {
      this.domElement.requestPointerLock =
        this.domElement.requestPointerLock ||
        this.domElement.mozRequestPointerLock ||
        this.domElement.webkitRequestPointerLock;
      if (this.domElement.requestPointerLock) {
        this.domElement.requestPointerLock();
      }
    } catch (e) {
      console.warn('Pointer lock request error:', e);
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  onPointerLockChange() {
    this.isPointerLocked =
      document.pointerLockElement === this.domElement ||
      document.mozPointerLockElement === this.domElement;
  }

  onKeyDown(e) {
    if (!this.enabled) return;

    const code = e.code;
    this.keys[code] = true;

    // Prevent default scrolling for common gaming keys
    if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    const code = e.code;
    this.keys[code] = false;
  }

  onMouseDown(e) {
    if (!this.enabled) return;
    this.isMouseDown = true;
    this.lastMousePos.x = e.clientX;
    this.lastMousePos.y = e.clientY;
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onMouseMove(e) {
    if (!this.enabled) return;

    const sens = saveManager.settings.mouseSensitivity || 1.0;
    const invertY = saveManager.settings.invertY ? -1 : 1;

    if (this.isPointerLocked) {
      this.mouseDelta.x += e.movementX * sens * 0.0022;
      this.mouseDelta.y += e.movementY * sens * 0.0022 * invertY;
    } else if (this.isMouseDown) {
      // Fallback drag-to-look when pointer lock isn't engaged
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.mouseDelta.x += dx * sens * 0.003;
      this.mouseDelta.y += dy * sens * 0.003 * invertY;
      this.lastMousePos.x = e.clientX;
      this.lastMousePos.y = e.clientY;
    }
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  isKeyJustPressed(code) {
    return !!this.keys[code] && !this.prevKeys[code];
  }

  // High-level Actions
  isMovingForward() {
    return this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp');
  }

  isMovingBackward() {
    return this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown');
  }

  isMovingLeft() {
    return this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft');
  }

  isMovingRight() {
    return this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight');
  }

  isJumping() {
    return this.isKeyJustPressed('Space');
  }

  isRunning() {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  isCrouching() {
    return this.isKeyDown('KeyC') || this.isKeyDown('ControlLeft') || this.isKeyDown('ControlRight');
  }

  isInteracting() {
    return this.isKeyJustPressed('KeyE');
  }

  isLanternFocused() {
    return this.isKeyDown('KeyF');
  }

  isJournalRequested() {
    return this.isKeyJustPressed('Tab');
  }

  isPauseRequested() {
    return this.isKeyJustPressed('Escape');
  }

  getMovementVector() {
    let x = 0;
    let z = 0;
    if (this.isMovingForward()) z -= 1;
    if (this.isMovingBackward()) z += 1;
    if (this.isMovingLeft()) x -= 1;
    if (this.isMovingRight()) x += 1;

    const len = Math.sqrt(x * x + z * z);
    if (len > 0.0001) {
      x /= len;
      z /= len;
    }
    return { x, z };
  }

  consumeLookDelta() {
    const delta = { x: this.mouseDelta.x, y: this.mouseDelta.y };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  update() {
    // Copy current state to prevKeys
    this.prevKeys = { ...this.keys };
  }

  reset() {
    this.keys = {};
    this.prevKeys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.isMouseDown = false;
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}

export const inputManager = new InputManager();
export default inputManager;
