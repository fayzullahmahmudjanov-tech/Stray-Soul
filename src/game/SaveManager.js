/**
 * SaveManager.js - Centralized LocalStorage save system with versioning,
 * checkpointing, memory persistence, settings, and safe chapter replay.
 */

const SAVE_KEY = 'the_stray_soul_save_v1';
const SETTINGS_KEY = 'the_stray_soul_settings_v1';

export const DEFAULT_SAVE_DATA = {
  version: 1,
  currentChapter: 'place-between',
  currentCheckpoint: 'anchor-place-between-1',
  spawnPoint: { x: 0, y: 1.5, z: 0 },
  unlockedChapters: ['place-between'],
  completedChapters: [],
  collectedMemories: [],
  storyFlags: {
    firstWakeup: false,
    firstWitnessSeen: false,
    firstAnchorLit: false,
    cityPuzzleSolved: false,
    forestGateOpened: false,
    railwayEscaped: false,
    clocktowerAligned: false,
    echoTruthDiscovered: false,
    journeyCompleted: false
  },
  puzzleState: {},
  playTimeSeconds: 0,
  lastSavedAt: null
};

export const DEFAULT_SETTINGS = {
  masterVolume: 0.8,
  musicVolume: 0.75,
  sfxVolume: 0.85,
  mouseSensitivity: 1.0,
  quality: 'high',
  cameraShake: true,
  invertY: false
};

class SaveManager {
  constructor() {
    this.data = this.loadSaveData();
    this.settings = this.loadSettings();
    this.isReplayMode = false;
    this.replayChapterId = null;
  }

  loadSaveData() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      }
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        storyFlags: { ...DEFAULT_SAVE_DATA.storyFlags, ...(parsed.storyFlags || {}) },
        puzzleState: { ...(parsed.puzzleState || {}) }
      };
    } catch (e) {
      console.warn('Failed to parse save data, initializing defaults:', e);
      return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  save() {
    if (this.isReplayMode) {
      // In replay mode, we still save memory relics, but preserve main campaign currentChapter/checkpoint
      const currentFullSave = this.loadSaveData();
      currentFullSave.collectedMemories = Array.from(
        new Set([...currentFullSave.collectedMemories, ...this.data.collectedMemories])
      );
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(currentFullSave));
      } catch (err) {
        console.error('Failed to save in replay mode', err);
      }
      return;
    }

    this.data.lastSavedAt = new Date().toISOString();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Failed to write save data to localStorage:', err);
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  newGame() {
    this.isReplayMode = false;
    this.replayChapterId = null;
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.save();
    return this.data;
  }

  setCheckpoint(chapterId, checkpointId, spawnPoint) {
    this.data.currentChapter = chapterId;
    this.data.currentCheckpoint = checkpointId;
    if (spawnPoint) {
      this.data.spawnPoint = {
        x: spawnPoint.x || 0,
        y: spawnPoint.y || 1.5,
        z: spawnPoint.z || 0
      };
    }
    if (!this.data.unlockedChapters.includes(chapterId)) {
      this.data.unlockedChapters.push(chapterId);
    }
    this.save();
  }

  unlockChapter(chapterId) {
    if (!this.data.unlockedChapters.includes(chapterId)) {
      this.data.unlockedChapters.push(chapterId);
      this.save();
    }
  }

  completeChapter(chapterId) {
    if (!this.data.completedChapters.includes(chapterId)) {
      this.data.completedChapters.push(chapterId);
      this.save();
    }
  }

  collectMemory(memoryId) {
    if (!this.data.collectedMemories.includes(memoryId)) {
      this.data.collectedMemories.push(memoryId);
      this.save();
      return true;
    }
    return false;
  }

  hasMemory(memoryId) {
    return this.data.collectedMemories.includes(memoryId);
  }

  setFlag(flagName, value = true) {
    this.data.storyFlags[flagName] = value;
    this.save();
  }

  getFlag(flagName) {
    return !!this.data.storyFlags[flagName];
  }

  setPuzzleState(puzzleId, state) {
    this.data.puzzleState[puzzleId] = state;
    this.save();
  }

  getPuzzleState(puzzleId) {
    return this.data.puzzleState[puzzleId];
  }

  startReplay(chapterId) {
    this.isReplayMode = true;
    this.replayChapterId = chapterId;
  }

  stopReplay() {
    this.isReplayMode = false;
    this.replayChapterId = null;
    this.data = this.loadSaveData();
  }

  resetAll() {
    localStorage.removeItem(SAVE_KEY);
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  }
}

export const saveManager = new SaveManager();
export default saveManager;
