/**
 * UIManager.js - Master User Interface Orchestrator
 * Coordinates HUD, prompt overlays, danger vignette, screen fade transitions,
 * story notifications, dialogue subtitles, and all menu modals.
 */

import { MainMenu } from './MainMenu.js';
import { PauseMenu } from './PauseMenu.js';
import { ChapterSelect } from './ChapterSelect.js';
import { MemoryJournal } from './MemoryJournal.js';
import { SettingsMenu } from './SettingsMenu.js';
import { DeathScreen } from './DeathScreen.js';

export class UIManager {
  constructor(gameCallbacks) {
    this.callbacks = gameCallbacks || {};

    // HUD Elements
    this.hudEl = document.getElementById('hud-container');
    this.reticleEl = document.getElementById('reticle');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptKeyEl = document.getElementById('prompt-key');
    this.promptTextEl = document.getElementById('prompt-text');
    this.crouchEl = document.getElementById('crouch-indicator');
    this.lanternBarEl = document.getElementById('lantern-focus-bar');
    this.dangerVignetteEl = document.getElementById('danger-vignette');
    this.screenFadeEl = document.getElementById('screen-fade');

    // Notifications & Subtitles
    this.storyNotifEl = document.getElementById('story-notification');
    this.storyTitleEl = document.getElementById('story-title');
    this.storySubtitleEl = document.getElementById('story-subtitle');
    this.whisperBoxEl = document.getElementById('whisper-box');
    this.whisperTextEl = document.getElementById('whisper-text');
    this.objectiveEl = document.getElementById('objective-text');

    // Ending screen elements
    this.endingScreenEl = document.getElementById('ending-screen');
    this.endingStatsEl = document.getElementById('ending-stats');
    this.endingReplayBtn = document.getElementById('btn-ending-replay');
    this.endingMenuBtn = document.getElementById('btn-ending-menu');

    // Initialize sub-menus
    this.mainMenu = new MainMenu({
      onContinue: () => this.callbacks.onContinueGame && this.callbacks.onContinueGame(),
      onNewGame: () => this.callbacks.onNewGame && this.callbacks.onNewGame(),
      onOpenChapters: () => this.chapterSelect.show(),
      onOpenJournal: () => this.memoryJournal.show(),
      onOpenSettings: () => this.settingsMenu.show()
    });

    this.pauseMenu = new PauseMenu({
      onResume: () => this.callbacks.onResumeGame && this.callbacks.onResumeGame(),
      onRestartCheckpoint: () => this.callbacks.onRestartCheckpoint && this.callbacks.onRestartCheckpoint(),
      onOpenJournal: () => this.memoryJournal.show(),
      onOpenSettings: () => this.settingsMenu.show(),
      onReturnToTitle: () => this.callbacks.onReturnToTitle && this.callbacks.onReturnToTitle()
    });

    this.chapterSelect = new ChapterSelect(chapterId => {
      if (this.callbacks.onSelectChapter) {
        this.callbacks.onSelectChapter(chapterId);
      }
    });

    this.memoryJournal = new MemoryJournal();

    this.settingsMenu = new SettingsMenu(qualityPreset => {
      if (this.callbacks.onApplyGraphics) {
        this.callbacks.onApplyGraphics(qualityPreset);
      }
    });

    this.deathScreen = new DeathScreen(
      () => this.callbacks.onRespawn && this.callbacks.onRespawn(),
      () => this.callbacks.onReturnToTitle && this.callbacks.onReturnToTitle()
    );

    this.bindEndingEvents();

    this.whisperTimeout = null;
    this.storyTimeout = null;
  }

  bindEndingEvents() {
    if (this.endingReplayBtn) {
      this.endingReplayBtn.addEventListener('click', () => {
        this.endingScreenEl.classList.add('hidden');
        if (this.callbacks.onSelectChapter) {
          this.callbacks.onSelectChapter('last-horizon');
        }
      });
    }

    if (this.endingMenuBtn) {
      this.endingMenuBtn.addEventListener('click', () => {
        this.endingScreenEl.classList.add('hidden');
        if (this.callbacks.onReturnToTitle) {
          this.callbacks.onReturnToTitle();
        }
      });
    }
  }

  showHUD() {
    this.hudEl.classList.remove('hidden');
  }

  hideHUD() {
    this.hudEl.classList.add('hidden');
  }

  setReticleHighlight(active) {
    if (active) this.reticleEl.classList.add('highlight');
    else this.reticleEl.classList.remove('highlight');
  }

  showInteractionPrompt(key, text) {
    this.promptKeyEl.textContent = key || 'E';
    this.promptTextEl.textContent = text || 'Interact';
    this.promptEl.classList.remove('hidden');
    this.setReticleHighlight(true);
  }

  hideInteractionPrompt() {
    this.promptEl.classList.add('hidden');
    this.setReticleHighlight(false);
  }

  setCrouchIndicator(isCrouching) {
    if (isCrouching) this.crouchEl.classList.remove('hidden');
    else this.crouchEl.classList.add('hidden');
  }

  setLanternCharge(ratio) {
    if (this.lanternBarEl) {
      this.lanternBarEl.style.width = `${Math.round(ratio * 100)}%`;
    }
  }

  setDangerVignette(active) {
    if (active) this.dangerVignetteEl.classList.add('active');
    else this.dangerVignetteEl.classList.remove('active');
  }

  setObjective(text) {
    if (this.objectiveEl) {
      this.objectiveEl.textContent = text;
    }
  }

  showStoryNotification(title, subtitle, duration = 4500) {
    if (this.storyTimeout) clearTimeout(this.storyTimeout);
    this.storyTitleEl.textContent = title;
    this.storySubtitleEl.textContent = subtitle || '';
    this.storyNotifEl.classList.add('show');

    this.storyTimeout = setTimeout(() => {
      this.storyNotifEl.classList.remove('show');
    }, duration);
  }

  showWhisper(text, duration = 4000) {
    if (this.whisperTimeout) clearTimeout(this.whisperTimeout);
    this.whisperTextEl.textContent = `"${text}"`;
    this.whisperBoxEl.classList.remove('hidden');

    this.whisperTimeout = setTimeout(() => {
      this.whisperBoxEl.classList.add('hidden');
    }, duration);
  }

  fadeIn(durationMs = 800) {
    return new Promise(resolve => {
      this.screenFadeEl.classList.remove('blackout');
      setTimeout(resolve, durationMs);
    });
  }

  fadeOut(durationMs = 800) {
    return new Promise(resolve => {
      this.screenFadeEl.classList.add('blackout');
      setTimeout(resolve, durationMs);
    });
  }

  showEnding(stats) {
    this.hideHUD();
    if (this.endingStatsEl && stats) {
      this.endingStatsEl.innerHTML = `
        <p style="color: var(--color-gold); font-size: 0.95rem; margin-top: 15px;">
          Echo Relics Uncovered: ${stats.memoriesCount || 0} / 14 &bull; Regions Explored: 7 / 7
        </p>
      `;
    }
    this.endingScreenEl.classList.remove('hidden');
  }
}

export default UIManager;
