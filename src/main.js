/**
 * main.js - Application Entry Point for THE STRAY SOUL
 */

import './styles/main.css';
import './styles/menus.css';
import './styles/hud.css';
import { Game } from './game/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();

  // Expose on window for debugging if needed
  window.__STRAY_SOUL_GAME__ = game;

  document.body.classList.remove('loading');
});
