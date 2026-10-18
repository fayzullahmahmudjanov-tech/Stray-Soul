/**
 * MemoryFragment.js - Collectible Narrative Relics
 * Floating relics with golden particle halos, gentle levitation,
 * and narrative lore snippets connecting the soul to its lost past.
 */

import * as THREE from 'three';
import { audioManager } from '../game/AudioManager.js';

export const MEMORY_DATA = {
  'memory-key': {
    id: 'memory-key',
    chapterId: 'place-between',
    title: 'An Ancient Iron Key',
    regionName: 'The Place Between',
    quote: 'It unlocks no grand fortress, yet the ridges fit comfortably in your hand.',
    narrative: 'A heavy key of blackened iron. As you touch the worn edges, an impression stirs: a quiet wooden door at the end of a long hallway, and the scent of rainwater on cedar boards. You do not remember the house, but your fingers remember turning the lock.'
  },
  'memory-flute': {
    id: 'memory-flute',
    chapterId: 'place-between',
    title: 'Carved Bone Flute',
    regionName: 'The Place Between',
    quote: 'Two holes are worn smooth by patient thumbprints.',
    narrative: 'A modest instrument made from polished mountain bone. When the wind passes through its hollow mouth, it hums a single unresolved note. Someone once played this beside a quiet ember while waiting for the stars to settle.'
  },
  'memory-bird': {
    id: 'memory-bird',
    chapterId: 'abandoned-city',
    title: 'Small Wooden Sparrow',
    regionName: 'The Abandoned City',
    quote: 'Whittled with a dull blade, smoothed by small hands.',
    narrative: 'A toy bird with rounded wings and uneven tail feathers. It was tucked into a dry crack between two cobblestones. Holding it brings no sorrow, only the strange certainty that once, laughter echoed in these now-silent streets.'
  },
  'memory-bell': {
    id: 'memory-bell',
    chapterId: 'abandoned-city',
    title: 'Weathered Brass Bell',
    regionName: 'The Abandoned City',
    quote: 'Its clapper is silent until shaken with care.',
    narrative: 'A small hand-bell etched with geometric ivy. In the distance, a high church tower answers in silence. The city did not collapse in battle; it was simply abandoned when everyone realized there was somewhere else they needed to be.'
  },
  'memory-musicbox': {
    id: 'memory-musicbox',
    chapterId: 'drowned-forest',
    title: 'Rusted Music Cylinder',
    regionName: 'The Drowned Forest',
    quote: 'The steel pins still strike seven sequential notes.',
    narrative: 'A brass comb from a forgotten music box, nestled among submerged willow roots. When you roll it gently with your thumb, it produces seven crystalline chimes. A lullaby for someone who had trouble closing their eyes in the dark.'
  },
  'memory-fabric': {
    id: 'memory-fabric',
    chapterId: 'drowned-forest',
    title: 'Indigo Cloth Ribbon',
    regionName: 'The Drowned Forest',
    quote: 'Dye that refused to fade even beneath the river.',
    narrative: 'A soft ribbon dyed the color of twilight. It was tied around a dead branch marking an ancient crossing. You recognize the dye: wild elderberries mashed in stone bowls during the first autumn chill.'
  },
  'memory-pocketwatch': {
    id: 'memory-pocketwatch',
    chapterId: 'silent-railway',
    title: 'Frozen Pocket Watch',
    regionName: 'The Silent Railway',
    quote: 'The hands are frozen at twenty past four.',
    narrative: 'The crystal face is cracked, but the delicate silver gearwork remains clean. You feel no urge to wind it. In this world between places, hours do not arrive or depart; only travelers do.'
  },
  'memory-ticket': {
    id: 'memory-ticket',
    chapterId: 'silent-railway',
    title: 'Faded Railway Token',
    regionName: 'The Silent Railway',
    quote: 'A stamped copper coin with no return destination.',
    narrative: 'A heavy copper disc stamped with an arrow pointing toward the mountain passes. The ticket conductor was never waiting; the gates were left open for anyone brave enough to board without knowing where the tracks end.'
  },
  'memory-locket': {
    id: 'memory-locket',
    chapterId: 'city-above-clouds',
    title: 'Tarnished Silver Locket',
    regionName: 'The City Above the Clouds',
    quote: 'Inside is a portrait faded down to faint silver outlines.',
    narrative: 'A circular pendant found high on an observation spire. Inside, two figures stand beneath a vast sky. Their faces have dissolved into the metal, but their hands are joined. Miraj whispers that they never existed. You know better.'
  },
  'memory-lens': {
    id: 'memory-lens',
    chapterId: 'city-above-clouds',
    title: 'Star Observatory Lens',
    regionName: 'The City Above the Clouds',
    quote: 'Looking through it bends the cloudline into constellations.',
    narrative: 'A thick concave glass lens from an ancient astronomical armillary. When you hold it up to your lantern, the warm beam refracts into a soft pathway of light pointing toward the distant horizon.'
  },
  'memory-feather': {
    id: 'memory-feather',
    chapterId: 'house-of-echoes',
    title: 'Shadow Quill',
    regionName: 'The House of Echoes',
    quote: 'Ink that writes only what the heart already knows.',
    narrative: 'A dark quill found on a writing desk that stands in impossible gravity. The paper beside it bears a single sentence in handwriting you recognize: "Do not let Miraj tell you that the search was foolish."'
  },
  'memory-mirror': {
    id: 'memory-mirror',
    chapterId: 'house-of-echoes',
    title: 'Cracked Hand Mirror',
    regionName: 'The House of Echoes',
    quote: 'The glass reflects your light, not your fear.',
    narrative: 'In the mirror, you see neither a monster nor a savior. Only a quiet soul wrapped in cloth, holding an amber flame. You were never meant to conquer this world. You were only meant to carry this lantern home.'
  },
  'memory-hearth': {
    id: 'memory-hearth',
    chapterId: 'last-horizon',
    title: 'Warm Hearth Stone',
    regionName: 'The Last Horizon',
    quote: 'Retains heat long after the fire has cooled.',
    narrative: 'A smooth river pebble that radiates a quiet, steady warmth. A stone carried from an old fireplace to warm a pocket during long journeys in the snow. It reminds you: a hearth does not need a kingdom to be a home.'
  },
  'memory-lantern': {
    id: 'memory-lantern',
    chapterId: 'last-horizon',
    title: 'Twin Amber Filament',
    regionName: 'The Last Horizon',
    quote: 'The wick that will never consume itself.',
    narrative: 'A delicate golden thread that matches the wick inside your own lantern. You understand now why the flame never went out. It was fueled not by oil, but by the quiet refusal to forget where you belong.'
  }
};

export class MemoryFragment {
  constructor(id, position) {
    this.id = id;
    this.data = MEMORY_DATA[id] || {
      id,
      title: 'Echo Relic',
      regionName: 'Forgotten Ruins',
      quote: 'A fragment of something once dear.',
      narrative: 'A quiet relic carrying the warmth of another time.'
    };

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = `Memory_${id}`;

    this.isCollected = false;
    this.animTime = Math.random() * 10;
    this.relicMesh = null;
    this.glowLight = null;
    this.particleSystem = null;

    this.buildMesh();
  }

  buildMesh() {
    // 1. Relic Core Mesh (stylized floating diamond/geometric talisman)
    const relicMat = new THREE.MeshStandardMaterial({
      color: 0xf5c26b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x4a3205,
      emissiveIntensity: 0.6
    });

    const geom = new THREE.OctahedronGeometry(0.18, 0);
    this.relicMesh = new THREE.Mesh(geom, relicMat);
    this.relicMesh.position.y = 0.65;
    this.group.add(this.relicMesh);

    // 2. Warm Amber Glow Light
    this.glowLight = new THREE.PointLight(0xffb84d, 1.8, 4.5);
    this.glowLight.position.set(0, 0.65, 0);
    this.group.add(this.glowLight);

    // 3. Floating Sparkle Particles
    const pCount = 14;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const angle = (i / pCount) * Math.PI * 2;
      const radius = 0.28 + (i % 3) * 0.08;
      pPos[i * 3] = Math.cos(angle) * radius;
      pPos[i * 3 + 1] = 0.65 + (Math.random() - 0.5) * 0.3;
      pPos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xffd27f,
      size: 0.065,
      transparent: true,
      opacity: 0.85
    });

    this.particleSystem = new THREE.Points(pGeom, pMat);
    this.group.add(this.particleSystem);
  }

  collect() {
    if (this.isCollected) return null;
    this.isCollected = true;
    this.group.visible = false;
    audioManager.playMemoryDiscovery();
    return this.data;
  }

  update(delta) {
    if (this.isCollected) return;

    this.animTime += delta;

    // Levitation and rotation
    const bob = Math.sin(this.animTime * 2.2) * 0.06;
    this.relicMesh.position.y = 0.65 + bob;
    this.relicMesh.rotation.y += delta * 1.4;
    this.relicMesh.rotation.x = Math.sin(this.animTime * 1.1) * 0.2;

    this.glowLight.position.y = 0.65 + bob;
    this.glowLight.intensity = 1.6 + Math.sin(this.animTime * 4.0) * 0.4;

    this.particleSystem.rotation.y -= delta * 0.8;
  }

  getInteractionDistance(pos) {
    return this.group.position.distanceTo(pos);
  }
}

export default MemoryFragment;
