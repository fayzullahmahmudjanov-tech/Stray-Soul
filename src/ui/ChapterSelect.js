/**
 * ChapterSelect.js - Dynamic Chapter Replay & Progression Modal
 * Displays all 7 major regions, unlock status, memory completion count,
 * and allows replaying any unlocked region without corrupting main campaign saves.
 */

import { saveManager } from '../game/SaveManager.js';
import { audioManager } from '../game/AudioManager.js';

export const CHAPTER_METADATA = [
  {
    id: 'place-between',
    title: 'Chapter I: The Place Between',
    badge: 'Opening Awakening',
    desc: 'Floating stone platforms suspended in cold mist. The soul wakes with a lantern and learns to cross the broken bridges.',
    totalMemories: 2
  },
  {
    id: 'abandoned-city',
    title: 'Chapter II: The Abandoned City',
    badge: 'Ruins & Alleys',
    desc: 'Tall crumbling tenements and suspended catwalks. The Crawling Shape stalks the quiet cobblestones below.',
    totalMemories: 2
  },
  {
    id: 'drowned-forest',
    title: 'Chapter III: The Drowned Forest',
    badge: 'Still Waters',
    desc: 'Twisted ancient roots rising from shallow reflective pools. Noise attracts the shadow; only roots offer quiet passage.',
    totalMemories: 2
  },
  {
    id: 'silent-railway',
    title: 'Chapter IV: The Silent Railway',
    badge: 'Subterranean Cavern',
    desc: 'Rusted locomotives spanning dark chasms. Aligning the tracks leads to a perilous dash through subterranean tunnels.',
    totalMemories: 2
  },
  {
    id: 'city-above-clouds',
    title: 'Chapter V: The City Above the Clouds',
    badge: 'High Spires',
    desc: 'Vertigo-inducing mountain bridges piercing a sea of clouds while the Hollow Giant slowly strides across the distant horizon.',
    totalMemories: 2
  },
  {
    id: 'house-of-echoes',
    title: 'Chapter VI: The House of Echoes',
    badge: 'Paradox & Mirrors',
    desc: 'Impossible architecture where rooms duplicate and reflections tell untruths. The Borrowed Face waits behind false doors.',
    totalMemories: 2
  },
  {
    id: 'last-horizon',
    title: 'Chapter VII: The Last Horizon',
    badge: 'Final Threshold',
    desc: 'A vast peaceful landscape of pale grass and twilight waters. The journey ends not in conquest, but in belonging.',
    totalMemories: 2
  }
];

export class ChapterSelect {
  constructor(onSelectChapter) {
    this.modal = document.getElementById('chapter-select-menu');
    this.grid = document.getElementById('chapter-cards-grid');
    this.closeBtn = document.getElementById('btn-close-chapters');
    this.onSelectChapter = onSelectChapter;

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        audioManager.playUiClick();
        this.hide();
      });
    }
  }

  show() {
    this.render();
    this.modal.classList.remove('hidden');
  }

  hide() {
    this.modal.classList.add('hidden');
  }

  render() {
    this.grid.innerHTML = '';
    const unlocked = saveManager.data.unlockedChapters || ['place-between'];
    const collectedMemories = saveManager.data.collectedMemories || [];

    CHAPTER_METADATA.forEach(ch => {
      const isUnlocked = unlocked.includes(ch.id);

      // Count memories collected in this chapter
      let count = 0;
      if (ch.id === 'place-between') {
        if (collectedMemories.includes('memory-key')) count++;
        if (collectedMemories.includes('memory-flute')) count++;
      } else if (ch.id === 'abandoned-city') {
        if (collectedMemories.includes('memory-bird')) count++;
        if (collectedMemories.includes('memory-bell')) count++;
      } else if (ch.id === 'drowned-forest') {
        if (collectedMemories.includes('memory-musicbox')) count++;
        if (collectedMemories.includes('memory-fabric')) count++;
      } else if (ch.id === 'silent-railway') {
        if (collectedMemories.includes('memory-pocketwatch')) count++;
        if (collectedMemories.includes('memory-ticket')) count++;
      } else if (ch.id === 'city-above-clouds') {
        if (collectedMemories.includes('memory-locket')) count++;
        if (collectedMemories.includes('memory-lens')) count++;
      } else if (ch.id === 'house-of-echoes') {
        if (collectedMemories.includes('memory-feather')) count++;
        if (collectedMemories.includes('memory-mirror')) count++;
      } else if (ch.id === 'last-horizon') {
        if (collectedMemories.includes('memory-hearth')) count++;
        if (collectedMemories.includes('memory-lantern')) count++;
      }

      const card = document.createElement('div');
      card.className = `chapter-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      card.innerHTML = `
        <span class="chapter-badge">${ch.badge}</span>
        <h3>${ch.title}</h3>
        <p class="chapter-desc">${isUnlocked ? ch.desc : 'This region remains shrouded in mist.'}</p>
        <div class="chapter-meta">
          <span>Relics Found</span>
          <span>${count} / ${ch.totalMemories}</span>
        </div>
        <button class="menu-btn primary small btn-play-chapter" ${isUnlocked ? '' : 'disabled'}>
          ${isUnlocked ? 'REPLAY REGION' : 'LOCKED'}
        </button>
      `;

      if (isUnlocked) {
        const btn = card.querySelector('.btn-play-chapter');
        btn.addEventListener('click', () => {
          audioManager.playUiClick();
          this.hide();
          if (this.onSelectChapter) {
            this.onSelectChapter(ch.id);
          }
        });
      }

      this.grid.appendChild(card);
    });
  }
}

export default ChapterSelect;
