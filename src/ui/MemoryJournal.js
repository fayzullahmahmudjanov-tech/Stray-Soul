/**
 * MemoryJournal.js - Interactive Echo Lore Journal
 * Displays discovered relics with region origins, evocative quotes,
 * and philosophical narratives illustrating the Stray Soul's forgotten past.
 */

import { saveManager } from '../game/SaveManager.js';
import { MEMORY_DATA } from '../entities/MemoryFragment.js';
import { audioManager } from '../game/AudioManager.js';

export class MemoryJournal {
  constructor() {
    this.modal = document.getElementById('memory-journal-menu');
    this.listEl = document.getElementById('journal-list');
    this.detailEl = document.getElementById('journal-detail');
    this.closeBtn = document.getElementById('btn-close-journal');

    this.selectedMemoryId = null;

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
    this.listEl.innerHTML = '';
    const collected = saveManager.data.collectedMemories || [];
    const allMemoryIds = Object.keys(MEMORY_DATA);

    let firstFoundId = null;

    allMemoryIds.forEach(id => {
      const data = MEMORY_DATA[id];
      const isFound = collected.includes(id);

      if (isFound && !firstFoundId) firstFoundId = id;

      const item = document.createElement('div');
      item.className = `journal-item ${isFound ? 'found' : 'locked'} ${this.selectedMemoryId === id ? 'active' : ''}`;

      item.innerHTML = `
        <span class="journal-item-title">${isFound ? data.title : 'Undiscovered Echo'}</span>
        <span class="journal-item-badge">${isFound ? '&#10003;' : '&#128274;'}</span>
      `;

      if (isFound) {
        item.addEventListener('click', () => {
          audioManager.playUiClick();
          this.selectMemory(id);
        });
      }

      this.listEl.appendChild(item);
    });

    if (this.selectedMemoryId && collected.includes(this.selectedMemoryId)) {
      this.showDetail(this.selectedMemoryId);
    } else if (firstFoundId) {
      this.selectMemory(firstFoundId);
    } else {
      this.detailEl.innerHTML = `
        <div class="journal-detail-empty">
          <p>No echoes have yet been uncovered.</p>
          <p style="font-size: 0.85rem; color: var(--color-text-dim); margin-top: 10px;">
            Search the forgotten ruins for floating golden relics to recall fragments of your purpose.
          </p>
        </div>
      `;
    }
  }

  selectMemory(id) {
    this.selectedMemoryId = id;
    const items = this.listEl.querySelectorAll('.journal-item');
    const allIds = Object.keys(MEMORY_DATA);
    items.forEach((item, idx) => {
      if (allIds[idx] === id) item.classList.add('active');
      else item.classList.remove('active');
    });
    this.showDetail(id);
  }

  showDetail(id) {
    const data = MEMORY_DATA[id];
    if (!data) return;

    this.detailEl.innerHTML = `
      <div class="journal-detail-header">
        <span class="journal-detail-region">${data.regionName}</span>
        <h3>${data.title}</h3>
      </div>
      <div class="journal-detail-text">"${data.quote}"</div>
      <div class="journal-detail-fragment">${data.narrative}</div>
    `;
  }
}

export default MemoryJournal;
