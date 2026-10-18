/**
 * PuzzleManager.js - Environmental Puzzles & Interactive Mechanisms
 * Handles switches, rotating gears, pushable crates, sluice valves,
 * lantern rune reveals, and altar resonance across all 7 chapters.
 */

import * as THREE from 'three';
import { audioManager } from './AudioManager.js';
import { saveManager } from './SaveManager.js';

export class PuzzleManager {
  constructor() {
    this.interactiveObjects = [];
    this.currentChapterId = 'place-between';
    this.onPuzzleSolvedCallback = null;
  }

  setChapter(chapterId) {
    this.currentChapterId = chapterId;
    this.interactiveObjects = [];
  }

  onPuzzleSolved(callback) {
    this.onPuzzleSolvedCallback = callback;
  }

  registerInteractable(obj) {
    this.interactiveObjects.push(obj);
  }

  getNearbyInteractable(playerPos, maxDistance = 2.4) {
    for (const obj of this.interactiveObjects) {
      if (obj.isResolved && !obj.allowReinteract) continue;
      const dist = obj.position.distanceTo(playerPos);
      if (dist <= (obj.interactRadius || maxDistance)) {
        return obj;
      }
    }
    return null;
  }

  interact(obj, player) {
    if (!obj || (obj.isResolved && !obj.allowReinteract)) return null;

    if (obj.type === 'switch') {
      return this.handleSwitch(obj);
    } else if (obj.type === 'valve') {
      return this.handleValve(obj);
    } else if (obj.type === 'gear_lever') {
      return this.handleGearLever(obj);
    } else if (obj.type === 'echo_altar') {
      return this.handleEchoAltar(obj);
    } else if (obj.type === 'gate_portal') {
      return this.handleGatePortal(obj);
    }

    return null;
  }

  handleSwitch(obj) {
    obj.state = !obj.state;
    obj.isResolved = true;

    // Visual lever rotation
    if (obj.handleMesh) {
      obj.handleMesh.rotation.z = obj.state ? 0.6 : -0.6;
    }

    audioManager.playUiClick();

    // Trigger associated door or bridge
    if (obj.targetObject) {
      if (obj.targetObject.type === 'bridge') {
        obj.targetObject.isLowered = true;
      } else if (obj.targetObject.type === 'door') {
        obj.targetObject.isOpen = true;
      }
    }

    saveManager.setPuzzleState(obj.id, true);
    if (this.onPuzzleSolvedCallback) {
      this.onPuzzleSolvedCallback(obj.id, obj.message || 'Mechanism activated.');
    }

    return obj.message || 'Mechanism engaged.';
  }

  handleValve(obj) {
    obj.rotations = (obj.rotations || 0) + 1;
    if (obj.wheelMesh) {
      obj.wheelMesh.rotation.y += Math.PI * 0.5;
    }
    audioManager.playUiClick();

    if (obj.rotations >= 2) {
      obj.isResolved = true;
      if (obj.targetObject && obj.targetObject.onDrain) {
        obj.targetObject.onDrain();
      }
      saveManager.setPuzzleState(obj.id, true);
      if (this.onPuzzleSolvedCallback) {
        this.onPuzzleSolvedCallback(obj.id, 'The sluice gate opens. The waters recede.');
      }
      return 'The waters recede, revealing the dry tunnel.';
    }

    return 'The rusted valve turns with a groaning shriek.';
  }

  handleGearLever(obj) {
    obj.gearStep = ((obj.gearStep || 0) + 1) % 4;
    audioManager.playUiClick();

    if (obj.gearMesh) {
      obj.gearMesh.rotation.y = obj.gearStep * (Math.PI * 0.5);
    }

    // Check if aligned
    if (obj.gearStep === obj.targetStep) {
      obj.isResolved = true;
      if (obj.bridgeMesh) {
        obj.bridgeMesh.visible = true;
      }
      saveManager.setPuzzleState(obj.id, true);
      if (this.onPuzzleSolvedCallback) {
        this.onPuzzleSolvedCallback(obj.id, 'The clocktower rings align. The bridge locks in place.');
      }
      return 'The clocktower mechanism clicks into alignment.';
    }

    return `The gear ring rotates (${obj.gearStep}/4)... not yet aligned.`;
  }

  handleEchoAltar(obj) {
    if (obj.isResolved) return 'The altar hums in quiet harmony.';
    obj.isResolved = true;

    if (obj.flameMesh) {
      obj.flameMesh.visible = true;
    }
    if (obj.pointLight) {
      obj.pointLight.intensity = 3.0;
    }

    audioManager.playAnchorActivation();
    saveManager.setPuzzleState(obj.id, true);

    if (this.onPuzzleSolvedCallback) {
      this.onPuzzleSolvedCallback(obj.id, 'An echo settles upon the stone. The sanctuary opens.');
    }

    return 'The memory echo resonates softly upon the ancient altar.';
  }

  handleGatePortal(obj) {
    if (this.onPuzzleSolvedCallback) {
      this.onPuzzleSolvedCallback(obj.id, 'Entering the next region...');
    }
    return 'Stepping through the threshold...';
  }

  update(delta) {
    // Dynamic updates for animated bridges/doors
    for (const obj of this.interactiveObjects) {
      if (obj.targetObject && obj.targetObject.isLowered && obj.targetObject.mesh) {
        const mesh = obj.targetObject.mesh;
        if (mesh.position.y < obj.targetObject.targetY) {
          mesh.position.y += delta * 2.0;
        }
      }
    }
  }
}

export default PuzzleManager;
