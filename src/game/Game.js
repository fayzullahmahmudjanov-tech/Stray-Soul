/**
 * Game.js - Master Game Controller
 * Coordinates Three.js render loop, physics step, state transitions,
 * checkpoints, contextual interactions, death, respawn, and ending.
 */

import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { CameraController } from './CameraController.js';
import { CollisionManager } from './CollisionManager.js';
import { PlayerController } from './PlayerController.js';
import { PuzzleManager } from './PuzzleManager.js';
import { ChapterManager } from './ChapterManager.js';
import { UIManager } from '../ui/UIManager.js';
import { StraySoul } from '../entities/StraySoul.js';
import { saveManager } from './SaveManager.js';
import { audioManager } from './AudioManager.js';

export const GAME_STATES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DEAD: 'DEAD',
  ENDING: 'ENDING'
};

export class Game {
  constructor() {
    this.state = GAME_STATES.TITLE;
    this.clock = new THREE.Clock();

    // 1. Scene & Renderer
    this.sceneManager = new SceneManager();

    // 2. Systems
    this.collisionManager = new CollisionManager();
    this.puzzleManager = new PuzzleManager();
    this.inputManager = new InputManager();

    // 3. UI
    this.uiManager = new UIManager({
      onContinueGame: () => this.continueGame(),
      onNewGame: () => this.startNewGame(),
      onResumeGame: () => this.resumeGame(),
      onRestartCheckpoint: () => this.respawnAtCheckpoint(),
      onReturnToTitle: () => this.returnToTitle(),
      onSelectChapter: chapterId => this.startChapterReplay(chapterId),
      onRespawn: () => this.respawnAtCheckpoint(),
      onApplyGraphics: preset => this.sceneManager.applyGraphicsPreset(preset)
    });

    // 4. Character & Camera
    this.soul = new StraySoul();
    this.sceneManager.scene.add(this.soul.group);

    this.cameraController = new CameraController(
      this.sceneManager.camera,
      this.sceneManager.canvas
    );

    this.playerController = new PlayerController(
      this.soul,
      this.cameraController,
      this.collisionManager
    );

    // 5. Chapter Manager
    this.chapterManager = new ChapterManager(
      this.sceneManager.scene,
      this.collisionManager,
      this.puzzleManager,
      this.uiManager
    );

    // Contextual interaction state
    this.currentInteractable = null;

    // Connect puzzle callback
    this.puzzleManager.onPuzzleSolved((id, message) => {
      if (id.startsWith('gate-')) {
        this.handleGateTrigger(id);
      } else {
        this.uiManager.showStoryNotification('MECHANISM ENGAGED', message);
      }
    });

    // Bind loop
    this.animate = this.animate.bind(this);
  }

  init() {
    this.inputManager.init(this.sceneManager.canvas);

    // Setup initial title diorama scene (Chapter 1 backdrop)
    const initialSpawn = this.chapterManager.loadChapter('place-between');
    this.playerController.setPosition(initialSpawn.x, initialSpawn.y, initialSpawn.z);

    // Setup Miraj catch callback on active chapter AI
    this.bindMirajCatchCallbacks();

    // Start render loop
    requestAnimationFrame(this.animate);
  }

  bindMirajCatchCallbacks() {
    if (this.chapterManager.currentChapterInstance && this.chapterManager.currentChapterInstance.mirajAI) {
      this.chapterManager.currentChapterInstance.mirajAI.onPlayerCaught(() => {
        this.triggerDeath();
      });
    }
  }

  async startNewGame() {
    audioManager.ensureContext();
    await this.uiManager.fadeOut(600);

    saveManager.newGame();
    this.uiManager.mainMenu.hide();

    const spawn = this.chapterManager.loadChapter('place-between');
    this.playerController.setPosition(spawn.x, spawn.y, spawn.z);
    this.bindMirajCatchCallbacks();

    this.state = GAME_STATES.PLAYING;
    this.uiManager.showHUD();
    this.inputManager.requestPointerLock();

    await this.uiManager.fadeIn(800);
    this.uiManager.showWhisper('You still remember, don\'t you?');
  }

  async continueGame() {
    audioManager.ensureContext();
    await this.uiManager.fadeOut(600);

    const savedData = saveManager.data;
    const targetChapter = savedData.currentChapter || 'place-between';
    const spawnPoint = savedData.spawnPoint || { x: 0, y: 1.5, z: 0 };

    this.uiManager.mainMenu.hide();

    const spawn = this.chapterManager.loadChapter(targetChapter, spawnPoint);
    this.playerController.setPosition(spawn.x, spawn.y, spawn.z);
    this.bindMirajCatchCallbacks();

    this.state = GAME_STATES.PLAYING;
    this.uiManager.showHUD();
    this.inputManager.requestPointerLock();

    await this.uiManager.fadeIn(800);
  }

  async startChapterReplay(chapterId) {
    audioManager.ensureContext();
    await this.uiManager.fadeOut(600);

    saveManager.startReplay(chapterId);
    this.uiManager.mainMenu.hide();
    this.uiManager.pauseMenu.hide();

    const spawn = this.chapterManager.loadChapter(chapterId);
    this.playerController.setPosition(spawn.x, spawn.y, spawn.z);
    this.bindMirajCatchCallbacks();

    this.state = GAME_STATES.PLAYING;
    this.uiManager.showHUD();
    this.inputManager.requestPointerLock();

    await this.uiManager.fadeIn(800);
  }

  resumeGame() {
    this.state = GAME_STATES.PLAYING;
    this.uiManager.pauseMenu.hide();
    this.uiManager.showHUD();
    this.inputManager.requestPointerLock();
  }

  pauseGame() {
    this.state = GAME_STATES.PAUSED;
    this.inputManager.exitPointerLock();
    this.uiManager.hideHUD();
    this.uiManager.pauseMenu.show();
  }

  async returnToTitle() {
    await this.uiManager.fadeOut(500);
    this.state = GAME_STATES.TITLE;
    this.inputManager.exitPointerLock();

    this.uiManager.hideHUD();
    this.uiManager.pauseMenu.hide();
    this.uiManager.deathScreen.hide();

    // Reload opening chapter for title diorama
    const spawn = this.chapterManager.loadChapter('place-between');
    this.playerController.setPosition(spawn.x, spawn.y, spawn.z);
    this.bindMirajCatchCallbacks();

    this.uiManager.mainMenu.show();
    await this.uiManager.fadeIn(600);
  }

  async respawnAtCheckpoint() {
    await this.uiManager.fadeOut(500);
    this.soul.respawn(new THREE.Vector3(saveManager.data.spawnPoint.x, saveManager.data.spawnPoint.y, saveManager.data.spawnPoint.z));

    const chapterId = saveManager.data.currentChapter || 'place-between';
    if (this.chapterManager.currentChapterId !== chapterId) {
      this.chapterManager.loadChapter(chapterId, saveManager.data.spawnPoint);
    }

    this.playerController.setPosition(
      saveManager.data.spawnPoint.x,
      saveManager.data.spawnPoint.y,
      saveManager.data.spawnPoint.z
    );

    this.bindMirajCatchCallbacks();
    audioManager.setTension(0);

    this.state = GAME_STATES.PLAYING;
    this.uiManager.deathScreen.hide();
    this.uiManager.showHUD();
    this.inputManager.requestPointerLock();

    await this.uiManager.fadeIn(600);
  }

  triggerDeath() {
    if (this.state === GAME_STATES.DEAD) return;
    this.state = GAME_STATES.DEAD;

    audioManager.playCaughtJolt();
    audioManager.setTension(0);
    this.soul.playDeathAnimation();
    this.inputManager.exitPointerLock();

    setTimeout(() => {
      this.uiManager.hideHUD();
      this.uiManager.deathScreen.show();
    }, 900);
  }

  async handleGateTrigger(gateId) {
    if (gateId === 'gate-final-sanctuary') {
      // Complete game ending sequence!
      this.state = GAME_STATES.ENDING;
      audioManager.ensureContext();
      saveManager.completeChapter('last-horizon');
      saveManager.setFlag('journeyCompleted', true);

      await this.uiManager.fadeOut(1500);
      this.inputManager.exitPointerLock();

      const stats = {
        memoriesCount: saveManager.data.collectedMemories.length
      };
      this.uiManager.showEnding(stats);
      return;
    }

    // Normal chapter progression
    const currentId = this.chapterManager.currentChapterId;
    const nextId = this.chapterManager.getNextChapterId(currentId);

    if (nextId) {
      await this.uiManager.fadeOut(800);
      saveManager.completeChapter(currentId);

      const spawn = this.chapterManager.loadChapter(nextId);
      this.playerController.setPosition(spawn.x, spawn.y, spawn.z);
      this.bindMirajCatchCallbacks();

      saveManager.setCheckpoint(nextId, `anchor-${nextId}-1`, spawn);

      await this.uiManager.fadeIn(800);
    }
  }

  checkContextualInteractions() {
    const playerPos = this.playerController.position;

    // 1. Check Anchors
    const anchors = this.chapterManager.getCurrentAnchors();
    for (const anchor of anchors) {
      const dist = anchor.getInteractionDistance(playerPos);
      if (dist < 2.8) {
        if (!anchor.isActivated) {
          this.uiManager.showInteractionPrompt('E', 'Kindle Ancient Anchor');
          if (this.inputManager.isInteracting()) {
            anchor.activate();
            saveManager.setCheckpoint(this.chapterManager.currentChapterId, anchor.id, {
              x: playerPos.x,
              y: playerPos.y,
              z: playerPos.z
            });
            this.uiManager.showStoryNotification('ANCHOR KINDLED', 'A safe haven burns against the dark.');
          }
          return;
        } else {
          this.uiManager.showInteractionPrompt('', 'Sanctuary of Light');
          return;
        }
      }
    }

    // 2. Check Memory Relics
    const memories = this.chapterManager.getCurrentMemories();
    for (const memory of memories) {
      if (memory.isCollected) continue;
      const dist = memory.getInteractionDistance(playerPos);
      if (dist < 2.4) {
        this.uiManager.showInteractionPrompt('E', `Uncover Relic: ${memory.data.title}`);
        if (this.inputManager.isInteracting()) {
          const relic = memory.collect();
          if (relic) {
            saveManager.collectMemory(relic.id);
            this.uiManager.showStoryNotification(relic.title, relic.quote);
          }
        }
        return;
      }
    }

    // 3. Check Puzzle Mechanisms (switches, valves, gears, portals)
    const puzzleInteractable = this.puzzleManager.getNearbyInteractable(playerPos);
    if (puzzleInteractable) {
      this.uiManager.showInteractionPrompt('E', puzzleInteractable.promptText || 'Interact');
      if (this.inputManager.isInteracting()) {
        const msg = this.puzzleManager.interact(puzzleInteractable, this.playerController);
        if (msg) {
          this.uiManager.showWhisper(msg, 3200);
        }
      }
      return;
    }

    // If nothing nearby, hide prompt
    this.uiManager.hideInteractionPrompt();
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === GAME_STATES.PLAYING) {
      // Check pause request
      if (this.inputManager.isPauseRequested()) {
        this.pauseGame();
        this.inputManager.update();
        return;
      }

      // Check journal request
      if (this.inputManager.isJournalRequested()) {
        this.uiManager.memoryJournal.show();
        this.inputManager.update();
        return;
      }

      // 1. Physics & Movement Update
      this.playerController.update(delta, this.inputManager);

      // 2. Camera Update
      const lookDelta = this.inputManager.consumeLookDelta();
      this.cameraController.setCollisionObjects(this.collisionManager.wallColliders);
      this.cameraController.update(
        delta,
        lookDelta,
        this.playerController.isCrouching,
        this.playerController.isRunning
      );

      // 3. Update Chapter Entities & Miraj AI
      this.chapterManager.update(
        delta,
        this.playerController.position,
        this.playerController.getHorizontalSpeed(),
        this.playerController.isCrouching,
        this.playerController.isRunning,
        this.playerController.isGrounded,
        this.soul.isLanternFocused
      );

      // 4. Update Puzzle animations
      this.puzzleManager.update(delta);

      // 5. Contextual Prompts & Interactions
      this.checkContextualInteractions();

      // 6. Update HUD indicators
      this.uiManager.setCrouchIndicator(this.playerController.isCrouching);
      this.uiManager.setLanternCharge(this.soul.focusCharge);

      // 7. Check Abyss Fall (Void Death)
      if (this.playerController.position.y < -22.0) {
        this.triggerDeath();
      }

      // Update Miraj danger vignette
      const activeAI = this.chapterManager.currentChapterInstance && this.chapterManager.currentChapterInstance.mirajAI;
      if (activeAI) {
        this.uiManager.setDangerVignette(activeAI.getSuspicion() > 40);
      } else {
        this.uiManager.setDangerVignette(false);
      }
    } else if (this.state === GAME_STATES.TITLE) {
      // Slow scenic camera orbit for title menu
      this.cameraController.yaw += delta * 0.08;
      this.cameraController.update(delta, { x: 0, y: 0 });
      this.soul.updateAnimation(delta, 0, true, false, false);
    }

    // Input state latch
    this.inputManager.update();

    // Render Scene
    this.sceneManager.render();
  }
}

export default Game;
