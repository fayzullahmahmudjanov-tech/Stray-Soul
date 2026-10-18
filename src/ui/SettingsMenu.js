/**
 * SettingsMenu.js - Game Settings & Graphics Configuration Modal
 * Adjusts volumes in real time, mouse sensitivity, graphics presets,
 * camera shake, and allows safe save resets with confirmation.
 */

import { saveManager } from '../game/SaveManager.js';
import { audioManager } from '../game/AudioManager.js';

export class SettingsMenu {
  constructor(onApplyGraphics) {
    this.modal = document.getElementById('settings-menu');
    this.closeBtn = document.getElementById('btn-close-settings');
    this.applyBtn = document.getElementById('btn-save-settings');
    this.resetSaveBtn = document.getElementById('btn-reset-save');

    this.masterSlider = document.getElementById('setting-master-vol');
    this.musicSlider = document.getElementById('setting-music-vol');
    this.sfxSlider = document.getElementById('setting-sfx-vol');
    this.mouseSlider = document.getElementById('setting-mouse-sens');
    this.graphicsSelect = document.getElementById('setting-graphics');
    this.shakeCheck = document.getElementById('setting-camera-shake');
    this.invertYCheck = document.getElementById('setting-invert-y');

    this.masterLabel = document.getElementById('label-master-vol');
    this.musicLabel = document.getElementById('label-music-vol');
    this.sfxLabel = document.getElementById('label-sfx-vol');
    this.mouseLabel = document.getElementById('label-mouse-sens');

    this.onApplyGraphics = onApplyGraphics;

    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        this.hide();
      });
    }

    if (this.applyBtn) {
      this.applyBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        this.apply();
        this.hide();
      });
    }

    // Dynamic slider updates
    if (this.masterSlider) {
      this.masterSlider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        this.masterLabel.textContent = `${Math.round(val * 100)}%`;
        audioManager.setVolumes(val, undefined, undefined);
      });
    }

    if (this.musicSlider) {
      this.musicSlider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        this.musicLabel.textContent = `${Math.round(val * 100)}%`;
        audioManager.setVolumes(undefined, val, undefined);
      });
    }

    if (this.sfxSlider) {
      this.sfxSlider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        this.sfxLabel.textContent = `${Math.round(val * 100)}%`;
        audioManager.setVolumes(undefined, undefined, val);
      });
    }

    if (this.mouseSlider) {
      this.mouseSlider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        this.mouseLabel.textContent = `${val.toFixed(1)}x`;
      });
    }

    // Reset Save Data with confirmation
    if (this.resetSaveBtn) {
      this.resetSaveBtn.addEventListener('click', () => {
        const confirmBox = document.getElementById('confirm-dialog');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmMsg = document.getElementById('confirm-message');
        const okBtn = document.getElementById('btn-confirm-ok');
        const cancelBtn = document.getElementById('btn-confirm-cancel');

        confirmTitle.textContent = 'Reset All Journey Records?';
        confirmMsg.textContent = 'All unlocked chapters, relics, and anchor checkpoints will be cleared.';
        confirmBox.classList.remove('hidden');

        const onOk = () => {
          saveManager.resetAll();
          confirmBox.classList.add('hidden');
          okBtn.removeEventListener('click', onOk);
          cancelBtn.removeEventListener('click', onCancel);
          window.location.reload();
        };

        const onCancel = () => {
          confirmBox.classList.add('hidden');
          okBtn.removeEventListener('click', onOk);
          cancelBtn.removeEventListener('click', onCancel);
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
      });
    }
  }

  show() {
    this.populate();
    this.modal.classList.remove('hidden');
  }

  hide() {
    this.modal.classList.add('hidden');
  }

  populate() {
    const s = saveManager.settings;
    if (this.masterSlider) {
      this.masterSlider.value = s.masterVolume ?? 0.8;
      this.masterLabel.textContent = `${Math.round((s.masterVolume ?? 0.8) * 100)}%`;
    }
    if (this.musicSlider) {
      this.musicSlider.value = s.musicVolume ?? 0.75;
      this.musicLabel.textContent = `${Math.round((s.musicVolume ?? 0.75) * 100)}%`;
    }
    if (this.sfxSlider) {
      this.sfxSlider.value = s.sfxVolume ?? 0.85;
      this.sfxLabel.textContent = `${Math.round((s.sfxVolume ?? 0.85) * 100)}%`;
    }
    if (this.mouseSlider) {
      this.mouseSlider.value = s.mouseSensitivity ?? 1.0;
      this.mouseLabel.textContent = `${(s.mouseSensitivity ?? 1.0).toFixed(1)}x`;
    }
    if (this.graphicsSelect) {
      this.graphicsSelect.value = s.quality || 'high';
    }
    if (this.shakeCheck) {
      this.shakeCheck.checked = s.cameraShake !== false;
    }
    if (this.invertYCheck) {
      this.invertYCheck.checked = !!s.invertY;
    }
  }

  apply() {
    const newSettings = {
      masterVolume: parseFloat(this.masterSlider.value),
      musicVolume: parseFloat(this.musicSlider.value),
      sfxVolume: parseFloat(this.sfxSlider.value),
      mouseSensitivity: parseFloat(this.mouseSlider.value),
      quality: this.graphicsSelect.value,
      cameraShake: this.shakeCheck.checked,
      invertY: this.invertYCheck.checked
    };

    saveManager.saveSettings(newSettings);
    audioManager.setVolumes(
      newSettings.masterVolume,
      newSettings.musicVolume,
      newSettings.sfxVolume
    );

    if (this.onApplyGraphics) {
      this.onApplyGraphics(newSettings.quality);
    }
  }
}

export default SettingsMenu;
