# THE STRAY SOUL — A Journey to Somewhere
### A Cinematic 3D Open-World Adventure for Desktop Browsers

> *"The world existed before the soul arrived. Its history, structures, creatures, ruins, and atmosphere are independent of you. You are not a savior; you are a traveler seeking where you belong."*

---

## 🎮 Game Overview

**THE STRAY SOUL** is a third-person cinematic 3D atmospheric adventure built with **Three.js**, **Vanilla JavaScript (ES Modules)**, and **Vite**.

The player controls a small, mysterious soul draped in a dark ragged cloak, holding a warm amber lantern that cuts through the fog. The soul has lost its memories, yet feels drawn toward a distant place of belonging. As the soul travels across seven connected regions, it is observed and pursued by **Miraj**, a shifting entity that seeks to make the soul abandon its purpose.

---

## 🗺️ The Seven Connected Regions

1. **Chapter I: The Place Between**  
   Floating stone platforms suspended in cold blue mist, broken bridges, movement and ledge climbing tutorials, the first Anchor shrine, the first narrative relics, and the distant silhouette of *The Tall Witness*.
2. **Chapter II: The Abandoned City**  
   Ruined stone tenements, narrow streets, suspended catwalks, moveable crate puzzle to scale broken walls, and stealth avoidance of *The Crawling Shape* patrolling below.
3. **Chapter III: The Drowned Forest**  
   Massive ancient roots emerging from shallow reflective water. Noise-sensitive survival (splashing in water alerts Miraj; traversing elevated roots provides silent passage), and a sluice valve drainage puzzle.
4. **Chapter IV: The Silent Railway**  
   Subterranean locomotive platforms, tracks spanning bottomless chasms, rail switch puzzle to reposition a rusted railcar, and a dark tunnel pursuit sequence against *The Unfinished*.
5. **Chapter V: The City Above the Clouds**  
   Soaring gothic spires, sea of clouds beneath, clocktower rotating ring gear puzzle, and the immense horizon silhouette of *The Hollow Giant*.
6. **Chapter VI: The House of Echoes**  
   Impossible architecture and surreal paradoxical rooms. Using the Lantern Focus `[F]` reveals glowing golden runes on the true doorway, uncovering the deceptive false doorway of *The Borrowed Face*.
7. **Chapter VII: The Last Horizon**  
   Vast peaceful plains of pale grass, reflective twilight waters, three Echo Altars, a peaceful final confrontation with Miraj, and arrival at the quiet hearth of belonging.

---

## 🕹️ Controls

| Key / Input | Action | Description |
| :--- | :--- | :--- |
| **W, A, S, D** / Arrows | Move | Camera-relative character movement |
| **Mouse** | Look / Camera | Free-look orbital third-person camera |
| **Click Canvas** | Pointer Lock | Lock mouse for seamless FPS/TPS camera rotation |
| **Space** | Jump | Leap across gaps and obstacles (with coyote time & buffering) |
| **Shift** | Run | Sprint forward |
| **C** / **Ctrl** | Crouch / Sneak | Low posture, muffles footsteps from sound-sensitive enemies |
| **E** | Interact | Kindle Anchors, uncover relics, pull levers, turn valves |
| **F** (Hold) | Lantern Focus | Expands warm amber beam to reveal hidden runes & paths |
| **Tab** | Echo Journal | Open interactive lore journal of uncovered memory relics |
| **Esc** | Pause | Open pause menu |

---

## 🛠️ Architecture & Technology Stack

```
project/
├── index.html                   # Semantic markup, HUD, modals, fonts & overlays
├── package.json                 # Project configuration (Three.js & Vite)
├── vite.config.js               # Dev server & production bundler configuration
├── src/
│   ├── main.js                  # Entry point
│   ├── game/
│   │   ├── Game.js              # Master state machine & game loop
│   │   ├── SceneManager.js      # Three.js WebGLRenderer, shadow maps, camera
│   │   ├── InputManager.js      # Pointer lock, keyboard & mouse state
│   │   ├── CameraController.js  # Orbital camera with collision avoidance & shake
│   │   ├── PlayerController.js  # Camera-relative physics, mantle/climb, velocity
│   │   ├── CollisionManager.js  # Raycast ground check, wall slide, box pushes
│   │   ├── PuzzleManager.js     # Environmental switches, valves, gears, altars
│   │   ├── ChapterManager.js    # Region loading without page reloads
│   │   ├── MirajAI.js           # 8-state AI machine (Vision cone, hearing, pursuit)
│   │   ├── AudioManager.js      # Zero-dependency Web Audio procedural synth
│   │   └── SaveManager.js       # LocalStorage persistence, versioning & replay
│   ├── entities/
│   │   ├── StraySoul.js         # Protagonist model, layered cloak, eyes & lantern
│   │   ├── Miraj.js             # 6 original manifestations of the antagonist
│   │   ├── Anchor.js            # Ancient stone shrines, brazier flame, safe zone
│   │   └── MemoryFragment.js    # 14 collectible relics with narrative lore
│   ├── chapters/                # The 7 distinct world regions
│   │   ├── PlaceBetween.js
│   │   ├── AbandonedCity.js
│   │   ├── DrownedForest.js
│   │   ├── SilentRailway.js
│   │   ├── CityAboveClouds.js
│   │   ├── HouseOfEchoes.js
│   │   └── LastHorizon.js
│   ├── ui/
│   │   ├── UIManager.js         # HUD, reticle, prompts, notifications, subtitles
│   │   ├── MainMenu.js          # Title screen with Continue, New Journey, Credits
│   │   ├── PauseMenu.js         # Resume, restart anchor, settings, quit
│   │   ├── ChapterSelect.js     # Cards for all 7 chapters with replay support
│   │   ├── MemoryJournal.js     # Interactive relic journal with lore fragments
│   │   ├── SettingsMenu.js      # Volume sliders, sensitivity, graphics presets
│   │   └── DeathScreen.js       # Atmospheric death screen & checkpoint reawaken
│   └── styles/
│       ├── main.css             # Design tokens, palette, screen overlays
│       ├── menus.css            # Dark glassmorphic modals & button animations
│       └── hud.css              # Reticle, contextual prompts, stealth indicator
```

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://127.0.0.1:5173/`.

3. **Production Build**:
   ```bash
   npm run build
   ```
   The compiled static files are generated in `dist/`.

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

---

## 🕯️ Special Systems

- **Procedural Web Audio Engine**: Zero external audio asset dependencies! All wind ambient filters, surface-aware footsteps (stone, metal, wood, water), lantern focus drones, crystal anchor chimes, relic sparkles, and dynamic tension drones are synthesized in real-time via the Web Audio API.
- **Save & Replay Architecture**: Automatically saves checkpoints, unlocked regions, settings, and collected relics to `localStorage`. Replaying earlier chapters preserves completed campaign progress.
- **Miraj Perception AI**: Features realistic vision cone occlusion checks, hearing sensitivity influenced by crouching, suspicion meter tracking, and safe sanctuary repulsion around activated Anchors.
