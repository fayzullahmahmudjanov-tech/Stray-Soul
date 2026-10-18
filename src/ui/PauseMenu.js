/**
 * PauseMenu.js - In-game Pause Screen
 */

import { audioManager } from '../game/AudioManager.js';

export class PauseMenu {
  constructor(handlers) {
    this.menuEl = document.getElementById('pause-menu');
    this.resumeBtn = document.getElementById('btn-pause-resume');
    this.checkpointBtn = document.getElementById('btn-pause-checkpoint');
    this.journalBtn = document.getElementById('btn-pause-journal');
    this.settingsBtn = document.getElementById('btn-pause-settings');
    this.returnMenuBtn = document.getElementById('btn-pause-menu');

    this.handlers = handlers || {};

    this.bindEvents();
  }

  bindEvents() {
    if (this.resumeBtn) {
      this.resumeBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.handlers.onResume) this.handlers.onResume();
      });
    }

    if (this.checkpointBtn) {
      this.checkpointBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.handlers.onRestartCheckpoint) this.handlers.onRestartCheckpoint();
      });
    }

    if (this.journalBtn) {
      this.journalBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.handlers.onOpenJournal) this.handlers.onOpenJournal();
      });
    }

    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.handlers.onOpenSettings) this.handlers.onOpenSettings();
      });
    }

    if (this.returnMenuBtn) {
      this.returnMenuBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.handlers.onReturnToTitle) this.handlers.onReturnToTitle();
      });
    }
  }

  show() {
    this.menuEl.classList.remove('hidden');
    this.menuEl.classList.add('active');
  }

  hide() {
    this.menuEl.classList.add('hidden');
    this.menuEl.classList.remove('active');
  }
}

export default PauseMenu;
