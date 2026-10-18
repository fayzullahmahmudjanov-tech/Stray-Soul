/**
 * DeathScreen.js - Atmospheric Death & Safe Checkpoint Respawn Overlay
 */

import { audioManager } from '../game/AudioManager.js';

export class DeathScreen {
  constructor(onRespawn, onReturnToMenu) {
    this.screen = document.getElementById('death-screen');
    this.respawnBtn = document.getElementById('btn-respawn');
    this.menuBtn = document.getElementById('btn-death-menu');

    this.onRespawn = onRespawn;
    this.onReturnToMenu = onReturnToMenu;

    if (this.respawnBtn) {
      this.respawnBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        this.hide();
        if (this.onRespawn) this.onRespawn();
      });
    }

    if (this.menuBtn) {
      this.menuBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        this.hide();
        if (this.onReturnToMenu) this.onReturnToMenu();
      });
    }
  }

  show() {
    this.screen.classList.remove('hidden');
  }

  hide() {
    this.screen.classList.add('hidden');
  }
}

export default DeathScreen;
