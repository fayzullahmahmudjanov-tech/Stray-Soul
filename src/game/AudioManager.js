/**
 * AudioManager.js - Zero-dependency procedural sound synthesizer via Web Audio API.
 * Provides region-specific ambient windscapes, generative minimalist music,
 * surface-aware footsteps, anchor chimes, memory relics, and Miraj tension drones.
 */

import { saveManager } from './SaveManager.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambientGain = null;

    this.isInitialized = false;
    this.ambientSource = null;
    this.ambientFilter = null;
    this.currentRegion = 'place-between';

    // Generative music state
    this.musicTimer = null;
    this.isMusicPlaying = false;
    this.tensionLevel = 0; // 0 (calm) to 1 (intense pursuit)

    // Heartbeat for Miraj detection
    this.heartbeatTimer = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(saveManager.settings.masterVolume ?? 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(saveManager.settings.musicVolume ?? 0.75, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(saveManager.settings.sfxVolume ?? 0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambient Gain
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.ambientGain.connect(this.sfxGain);

      this.isInitialized = true;
      this.startAmbient();
      this.startGenerativeMusic();
    } catch (err) {
      console.warn('Web Audio API could not initialize automatically (waiting for user interaction):', err);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes(master, music, sfx) {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    if (master !== undefined) this.masterGain.gain.setTargetAtTime(master, now, 0.05);
    if (music !== undefined) this.musicGain.gain.setTargetAtTime(music, now, 0.05);
    if (sfx !== undefined) this.sfxGain.gain.setTargetAtTime(sfx, now, 0.05);
  }

  // Region-aware procedural ambient noise
  startAmbient() {
    if (!this.ctx) return;
    try {
      // 5-second buffer of pink/brown noise
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter approximation
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      this.ambientSource = this.ctx.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      // Bandpass filter for wind/cavern resonance
      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'bandpass';
      this.ambientFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
      this.ambientFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.ambientSource.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientSource.start();

      this.updateAmbientForRegion(this.currentRegion);
    } catch (e) {
      console.warn('Ambient start error:', e);
    }
  }

  setRegion(regionId) {
    this.currentRegion = regionId;
    this.updateAmbientForRegion(regionId);
  }

  updateAmbientForRegion(regionId) {
    if (!this.ambientFilter || !this.ctx) return;
    const now = this.ctx.currentTime;

    const regionPresets = {
      'place-between': { freq: 240, Q: 2.2, gain: 0.45 },
      'abandoned-city': { freq: 380, Q: 1.5, gain: 0.55 },
      'drowned-forest': { freq: 190, Q: 1.8, gain: 0.5 },
      'silent-railway': { freq: 110, Q: 3.5, gain: 0.65 },
      'city-above-clouds': { freq: 650, Q: 1.2, gain: 0.75 },
      'house-of-echoes': { freq: 320, Q: 4.0, gain: 0.5 },
      'last-horizon': { freq: 220, Q: 1.0, gain: 0.4 }
    };

    const preset = regionPresets[regionId] || regionPresets['place-between'];
    this.ambientFilter.frequency.setTargetAtTime(preset.freq, now, 1.5);
    this.ambientFilter.Q.setTargetAtTime(preset.Q, now, 1.5);
    this.ambientGain.gain.setTargetAtTime(preset.gain, now, 1.5);
  }

  // Generative Minimalist Music
  startGenerativeMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Dorian/Aeolian meditative scales (Hz)
    const scale = [
      146.83, // D3
      164.81, // E3
      174.61, // F3
      196.00, // G3
      220.00, // A3
      246.94, // B3
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00  // A4
    ];

    const playNextNote = () => {
      if (!this.isMusicPlaying || !this.ctx) return;

      // Note selection based on tension
      if (this.tensionLevel < 0.3) {
        // Quiet atmospheric chords
        if (Math.random() < 0.65) {
          const root = scale[Math.floor(Math.random() * 5)];
          const third = scale[Math.floor(Math.random() * 5) + 2] || root * 1.5;
          this.playPianoNote(root, 3.5, 0.15);
          setTimeout(() => this.playPianoNote(third, 3.0, 0.1), 300);
        }
      } else {
        // High tension drone & urgent pulse
        const root = scale[0] * 0.5; // low D
        this.playTensionPulse(root, 0.35);
      }

      const nextDelay = this.tensionLevel > 0.5 ? (800 + Math.random() * 600) : (3500 + Math.random() * 4500);
      this.musicTimer = setTimeout(playNextNote, nextDelay);
    };

    playNextNote();
  }

  playPianoNote(freq, duration = 3.0, volume = 0.2) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft triangle + lowpass for warm electric piano / chime timbre
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch (e) {}
  }

  playTensionPulse(freq = 73.4, volume = 0.3) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.4);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  setTension(level) {
    this.tensionLevel = Math.max(0, Math.min(1, level));
    if (this.tensionLevel > 0.3 && !this.heartbeatTimer) {
      this.startHeartbeat();
    } else if (this.tensionLevel <= 0.3 && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.playHeartbeat();
    }, 900);
  }

  playHeartbeat() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.15);

      gain.gain.setValueAtTime(0.35 * this.tensionLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // SFX: Footsteps
  playFootstep(surface = 'stone', isCrouching = false) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = surface === 'water' ? 'lowpass' : (surface === 'wood' ? 'bandpass' : 'highpass');
      filter.frequency.setValueAtTime(surface === 'water' ? 600 : (surface === 'wood' ? 400 : 1200), now);

      const gain = this.ctx.createGain();
      const vol = isCrouching ? 0.03 : 0.12;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.08);
    } catch (e) {}
  }

  // SFX: Jump & Land
  playJump() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.14);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playLand() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // SFX: Anchor Checkpoint Chime
  playAnchorActivation() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Resonant temple bell harmonics
      const freqs = [432, 648, 864, 1296];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        const duration = 2.8 - idx * 0.4;
        gain.gain.setValueAtTime(0.25 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + duration);
      });
    } catch (e) {}
  }

  // SFX: Memory Relic Discovery Sparkle
  playMemoryDiscovery() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      arpeggio.forEach((note, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now + i * 0.08);

        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.3);
      });
    } catch (e) {}
  }

  // SFX: Lantern Focus On / Off
  playLanternPulse(active = true) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (active) {
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
      } else {
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);
      }

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  // SFX: Miraj Catch Strike
  playCaughtJolt() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  // SFX: UI Click
  playUiClick() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }
}

export const audioManager = new AudioManager();
export default audioManager;
