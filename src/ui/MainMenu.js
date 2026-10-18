/**
 * MainMenu.js - Title Screen Navigation
 */

import { saveManager } from '../game/SaveManager.js';
import { audioManager } from '../game/AudioManager.js';

export class MainMenu {
  constructor(handlers) {
    this.menuEl = document.getElementById('main-menu');
    this.continueBtn = document.getElementById('btn-continue');
    this.newGameBtn = document.getElementById('btn-new-game');
    this.chaptersBtn = document.getElementById('btn-chapter-select');
    this.memoriesBtn = document.getElementById('btn-memories');
    this.settingsBtn = document.getElementById('btn-settings');
    this.creditsBtn = document.getElementById('btn-credits');
    this.creditsModal = document.getElementById('credits-menu');
    this.closeCreditsBtn = document.getElementById('btn-close-credits');

    this.handlers = handlers || {};

    this.bindEvents();
    this.updateContinueState();
  }

  bindEvents() {
    if (this.continueBtn) {
      this.continueBtn.addEventListener('click', () => {
        if (this.continueBtn.classList.contains('disabled')) return;
        audioManager.playUiClick();
        if (this.handlers.onContinue) this.handlers.onContinue();
      });
    }

    if (this.newGameBtn) {
      this.newGameBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (saveManager.hasSave()) {
          const confirmBox = document.getElementById('confirm-dialog');
          const confirmTitle = document.getElementById('confirm-title');
          const confirmMsg = document.getElementById('confirm-message');
          const okBtn = document.getElementById('btn-confirm-ok');
          const cancelBtn = document.getElementById('btn-confirm-cancel');

          confirmTitle.textContent = 'Begin New Journey?';
          confirmMsg.textContent = 'Starting a new journey will replace existing chapter progress.';
          confirmBox.classList.remove('hidden');

          const onOk = () => {
            confirmBox.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            if (this.handlers.onNewGame) this.handlers.onNewGame();
          };

          const onCancel = () => {
            confirmBox.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
          };

          okBtn.addEventListener('click', onOk);
          cancelBtn.addEventListener('click', onCancel);
        } else {
          if (this.handlers.onNewGame) this.handlers.onNewGame();
        }
      });
    }

    if (this.chaptersBtn) {
      this.chaptersBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.handlers.onOpenChapters) this.handlers.onOpenChapters();
      });
    }

    if (this.memoriesBtn) {
      this.memoriesBtn.addEventListener('click', () => {
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

    if (this.creditsBtn) {
      this.creditsBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.creditsModal) this.creditsModal.classList.remove('hidden');
      });
    }

    if (this.closeCreditsBtn) {
      this.closeCreditsBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        if (this.creditsModal) this.creditsModal.classList.add('hidden');
      });
    }
  }

  updateContinueState() {
    const hasSave = saveManager.hasSave();
    if (this.continueBtn) {
      if (hasSave) {
        this.continueBtn.classList.remove('disabled');
        this.continueBtn.removeAttribute('disabled');
      } else {
        this.continueBtn.classList.add('disabled');
        this.continueBtn.setAttribute('disabled', 'true');
      }
    }
  }

  show() {
    this.updateContinueState();
    this.menuEl.classList.remove('hidden');
    this.menuEl.classList.add('active');
  }

  hide() {
    this.menuEl.classList.add('hidden');
    this.menuEl.classList.remove('active');
  }
}

export default MainMenu;
