/**
 * ChapterManager.js - Seamless Chapter Loader and Progression Coordinator
 * Handles transitions between all 7 major world regions without reloading the page.
 */

import { PlaceBetween } from '../chapters/PlaceBetween.js';
import { AbandonedCity } from '../chapters/AbandonedCity.js';
import { DrownedForest } from '../chapters/DrownedForest.js';
import { SilentRailway } from '../chapters/SilentRailway.js';
import { CityAboveClouds } from '../chapters/CityAboveClouds.js';
import { HouseOfEchoes } from '../chapters/HouseOfEchoes.js';
import { LastHorizon } from '../chapters/LastHorizon.js';
import { audioManager } from './AudioManager.js';
import { saveManager } from './SaveManager.js';

export const CHAPTER_OBJECTIVES = {
  'place-between': 'Cross the broken bridges and find the ancient stone archway.',
  'abandoned-city': 'Scale the ruined tenements to reach the high transit platform.',
  'drowned-forest': 'Navigate silently across the ancient roots and open the sluice gate.',
  'silent-railway': 'Align the railway tracks and escape through the subterranean tunnel.',
  'city-above-clouds': 'Align the clocktower rings to reach the observatory bridge.',
  'house-of-echoes': 'Use your lantern to reveal the true threshold and bypass the false door.',
  'last-horizon': 'Attune the memory echoes and step into the quiet hearth where you belong.'
};

export class ChapterManager {
  constructor(scene, collisionManager, puzzleManager, uiManager) {
    this.scene = scene;
    this.collision = collisionManager;
    this.puzzle = puzzleManager;
    this.ui = uiManager;

    this.currentChapterInstance = null;
    this.currentChapterId = null;
  }

  loadChapter(chapterId, customSpawnPoint = null) {
    // 1. Cleanup current chapter
    if (this.currentChapterInstance) {
      this.currentChapterInstance.cleanup();
      this.currentChapterInstance = null;
    }

    this.currentChapterId = chapterId;
    this.puzzle.setChapter(chapterId);

    // 2. Instantiate new Chapter
    let chapterInstance = null;
    switch (chapterId) {
      case 'place-between':
        chapterInstance = new PlaceBetween(this.scene, this.collision, this.puzzle);
        break;
      case 'abandoned-city':
        chapterInstance = new AbandonedCity(this.scene, this.collision, this.puzzle);
        break;
      case 'drowned-forest':
        chapterInstance = new DrownedForest(this.scene, this.collision, this.puzzle);
        break;
      case 'silent-railway':
        chapterInstance = new SilentRailway(this.scene, this.collision, this.puzzle);
        break;
      case 'city-above-clouds':
        chapterInstance = new CityAboveClouds(this.scene, this.collision, this.puzzle);
        break;
      case 'house-of-echoes':
        chapterInstance = new HouseOfEchoes(this.scene, this.collision, this.puzzle);
        break;
      case 'last-horizon':
        chapterInstance = new LastHorizon(this.scene, this.collision, this.puzzle);
        break;
      default:
        console.warn(`Unknown chapter ID: ${chapterId}, defaulting to place-between`);
        chapterInstance = new PlaceBetween(this.scene, this.collision, this.puzzle);
        this.currentChapterId = 'place-between';
        break;
    }

    this.currentChapterInstance = chapterInstance;

    // 3. Update Audio Ambience
    audioManager.setRegion(this.currentChapterId);

    // 4. Update Objectives & Story Notifications
    const objective = CHAPTER_OBJECTIVES[this.currentChapterId] || 'Explore the ruins.';
    this.ui.setObjective(objective);
    this.ui.showStoryNotification(chapterInstance.name, chapterInstance.subtitle);

    // 5. Unlock chapter in SaveManager
    saveManager.unlockChapter(this.currentChapterId);

    // Determine spawn position
    const spawn = customSpawnPoint || chapterInstance.spawnPoint;
    return spawn;
  }

  update(delta, playerPos, playerSpeed, isCrouching, isRunning, isGrounded, isLanternFocused) {
    if (this.currentChapterInstance) {
      this.currentChapterInstance.update(
        delta,
        playerPos,
        playerSpeed,
        isCrouching,
        isRunning,
        isGrounded,
        isLanternFocused
      );
    }
  }

  getCurrentAnchors() {
    return this.currentChapterInstance ? this.currentChapterInstance.anchors : [];
  }

  getCurrentMemories() {
    return this.currentChapterInstance ? this.currentChapterInstance.memories : [];
  }

  getNextChapterId(currentId) {
    const chapterSequence = [
      'place-between',
      'abandoned-city',
      'drowned-forest',
      'silent-railway',
      'city-above-clouds',
      'house-of-echoes',
      'last-horizon'
    ];
    const idx = chapterSequence.indexOf(currentId);
    if (idx >= 0 && idx < chapterSequence.length - 1) {
      return chapterSequence[idx + 1];
    }
    return null; // Final chapter reached
  }
}

export default ChapterManager;
