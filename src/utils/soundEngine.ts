import * as Tone from 'tone';

export type SoundType =
  | 'ui_click'
  | 'quest_create'
  | 'quest_easy'
  | 'quest_medium'
  | 'quest_hard'
  | 'quest_boss'
  | 'rank_up'
  | 'coin_purchase'
  | 'item_use'
  | 'streak_flame'
  | 'scroll_open'
  | 'error_block';

export type AmbientType = 'off' | 'rain' | 'hearth' | 'abyss';

// Global Audio Engine State
let isContextStarted = false;
let currentVolumePercent = 75;
let isMuted = false;

/**
 * Initialize AudioContext on first user interaction to bypass browser autoplay blocks
 */
export function initAudioContext(): void {
  if (typeof window === 'undefined') return;

  const unlockAudio = async () => {
    try {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }
      isContextStarted = true;
      // Remove listeners after initial unlock
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    } catch (e) {
      console.debug('Tone audio context unlock waiting:', e);
    }
  };

  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
}

// Auto-register unlocker on import
if (typeof window !== 'undefined') {
  initAudioContext();
}

/**
 * Set Master Volume (0 - 100)
 */
export function setMasterVolume(volumePercent: number, enabled = true): void {
  currentVolumePercent = Math.max(0, Math.min(100, volumePercent));
  isMuted = !enabled || currentVolumePercent === 0;

  try {
    if (typeof window !== 'undefined') {
      if (isMuted) {
        Tone.getDestination().mute = true;
      } else {
        Tone.getDestination().mute = false;
        // Convert percentage 1-100 to Decibels (-40dB to 0dB)
        const db = 20 * Math.log10(currentVolumePercent / 100);
        Tone.getDestination().volume.value = Math.max(-48, Math.min(6, db));
      }
    }
  } catch (err) {
    console.debug('Error adjusting Tone master volume:', err);
  }
}

/**
 * Ensure Tone AudioContext is active before playing
 */
async function ensureToneRunning(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
      isContextStarted = true;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// 12 DARK FANTASY PROCEDURAL SOUND SYNTHESIZERS (Obsidian & Steel Audio Engine)
// ============================================================================

/**
 * 1. ui_click: Gõ đá obsidian cực nhẹ, ngắn (30ms)
 */
function playUiClick(): void {
  const synth = new Tone.MembraneSynth({
    pitchDecay: 0.015,
    octaves: 2,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
  }).toDestination();
  synth.volume.value = -6;
  synth.triggerAttackRelease('A5', '32n');
  setTimeout(() => synth.dispose(), 300);
}

/**
 * 2. quest_create: Khắc kim loại lên phiến đá (Metallic etch on stone)
 */
function playQuestCreate(): void {
  const now = Tone.now();
  // Stone carve friction
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.05 },
  }).toDestination();
  noise.volume.value = -12;
  noise.triggerAttackRelease('16n', now);

  // Metal resonance
  const metal = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.18, release: 0.1 },
    harmonicity: 4.1,
    modulationIndex: 28,
    resonance: 3200,
    octaves: 1.2,
  }).toDestination();
  metal.volume.value = -14;
  metal.triggerAttackRelease('C5', '16n', now + 0.02);

  setTimeout(() => {
    noise.dispose();
    metal.dispose();
  }, 600);
}

/**
 * 3. quest_easy: Chuông bạc thanh thoát (Silver bell chime)
 */
function playQuestEasy(): void {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.45, sustain: 0.02, release: 0.35 },
  }).toDestination();
  synth.volume.value = -8;

  const now = Tone.now();
  synth.triggerAttackRelease('E5', '8n', now);
  synth.triggerAttackRelease('B5', '8n', now + 0.08);
  synth.triggerAttackRelease('E6', '4n', now + 0.16);

  setTimeout(() => synth.dispose(), 1200);
}

/**
 * 4. quest_medium: Kiếm thép vung chém đanh gọn (Steel sword slash)
 */
function playQuestMedium(): void {
  const now = Tone.now();

  // Whoosh slash
  const noise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
  }).toDestination();
  noise.volume.value = -10;
  noise.triggerAttackRelease('16n', now);

  // Clean steel blade ring
  const metal = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.35, release: 0.2 },
    harmonicity: 5.2,
    modulationIndex: 22,
    resonance: 4200,
    octaves: 1.5,
  }).toDestination();
  metal.volume.value = -10;
  metal.triggerAttackRelease('F#4', '8n', now + 0.04);

  // Harmonic chord resolution
  const poly = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0, release: 0.2 },
  }).toDestination();
  poly.volume.value = -12;
  poly.triggerAttackRelease(['D4', 'A4'], '8n', now + 0.05);

  setTimeout(() => {
    noise.dispose();
    metal.dispose();
    poly.dispose();
  }, 1200);
}

/**
 * 5. quest_hard: Va chạm vũ khí nặng vang dội (Heavy weapon impact & resonance)
 */
function playQuestHard(): void {
  const now = Tone.now();

  // Heavy bass impact thud
  const membrane = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.5, sustain: 0.01, release: 0.4 },
  }).toDestination();
  membrane.volume.value = -3;
  membrane.triggerAttackRelease('C2', '4n', now);

  // Dense metal clash
  const metal = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.6, release: 0.4 },
    harmonicity: 3.5,
    modulationIndex: 45,
    resonance: 2800,
    octaves: 2.5,
  }).toDestination();
  metal.volume.value = -8;
  metal.triggerAttackRelease('G3', '4n', now + 0.02);

  // Low echoing undertone
  const lowSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.7, sustain: 0, release: 0.3 },
  }).toDestination();
  lowSynth.volume.value = -14;
  lowSynth.triggerAttackRelease('E2', '2n', now + 0.06);

  setTimeout(() => {
    membrane.dispose();
    metal.dispose();
    lowSynth.dispose();
  }, 1800);
}

/**
 * 6. quest_boss: Chiêng trận trầm hùng + Hợp âm kèn trận 3 nốt khải hoàn (Epic Boss Defeat)
 */
function playQuestBoss(): void {
  const now = Tone.now();

  // 1. Deep War Gong
  const gong = new Tone.MembraneSynth({
    pitchDecay: 0.12,
    octaves: 5,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 1.5, sustain: 0.05, release: 1.0 },
  }).toDestination();
  gong.volume.value = 0;
  gong.triggerAttackRelease('G1', '1m', now);

  // Gong shimmer
  const metalGong = new Tone.MetalSynth({
    envelope: { attack: 0.01, decay: 1.2, release: 0.8 },
    harmonicity: 2.2,
    modulationIndex: 35,
    resonance: 1800,
    octaves: 3,
  }).toDestination();
  metalGong.volume.value = -9;
  metalGong.triggerAttackRelease('D2', '2n', now + 0.02);

  // 2. Triumphant Brass Chord Fanfare
  const brass = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.08, decay: 0.6, sustain: 0.4, release: 0.8 },
  }).toDestination();
  brass.volume.value = -8;

  // 3-note epic brass progression
  brass.triggerAttackRelease(['C3', 'G3'], '4n', now + 0.25);
  brass.triggerAttackRelease(['E3', 'B3'], '4n', now + 0.55);
  brass.triggerAttackRelease(['C4', 'G4', 'C5'], '2n', now + 0.9);

  setTimeout(() => {
    gong.dispose();
    metalGong.dispose();
    brass.dispose();
  }, 2500);
}

/**
 * 7. rank_up: Kèn lệnh hoàng gia vang dội (Brass fanfare & ringing chime)
 */
function playRankUp(): void {
  const now = Tone.now();

  const brass = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.04, decay: 0.4, sustain: 0.2, release: 0.5 },
  }).toDestination();
  brass.volume.value = -6;

  // Heroic arpeggio: C4, E4, G4, C5, E5, G5
  const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5'];
  notes.forEach((note, idx) => {
    brass.triggerAttackRelease(note, '8n', now + idx * 0.1);
  });

  // Final sustained royal chord
  brass.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '2n', now + 0.7);

  // High silver bells shimmer
  const bell = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.8, sustain: 0.05, release: 0.8 },
  }).toDestination();
  bell.volume.value = -10;
  bell.triggerAttackRelease(['C6', 'G6'], '1n', now + 0.75);

  setTimeout(() => {
    brass.dispose();
    bell.dispose();
  }, 2400);
}

/**
 * 8. coin_purchase: Xóc túi tiền xu vàng leng keng giòn giã (Golden coins cascading)
 */
function playCoinPurchase(): void {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.15 },
  }).toDestination();
  synth.volume.value = -8;

  const now = Tone.now();
  const coinNotes = ['B5', 'E6', 'G#6', 'B6'];
  coinNotes.forEach((note, idx) => {
    synth.triggerAttackRelease(note, '16n', now + idx * 0.05);
  });

  setTimeout(() => synth.dispose(), 900);
}

/**
 * 9. item_use: Sủi bọt bình độc dược + chuông ma pháp lấp lánh (Potion consume)
 */
function playItemUse(): void {
  const now = Tone.now();

  // Bubbling glide
  const bubble = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
  }).toDestination();
  bubble.volume.value = -8;

  bubble.triggerAttackRelease('A4', '32n', now);
  bubble.triggerAttackRelease('D5', '32n', now + 0.06);
  bubble.triggerAttackRelease('G5', '32n', now + 0.12);

  // Shimmering magical arpeggio
  const magic = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.3 },
  }).toDestination();
  magic.volume.value = -10;

  const notes = ['D5', 'F#5', 'A5', 'D6', 'F#6'];
  notes.forEach((note, idx) => {
    magic.triggerAttackRelease(note, '16n', now + 0.18 + idx * 0.06);
  });

  setTimeout(() => {
    bubble.dispose();
    magic.dispose();
  }, 1200);
}

/**
 * 10. streak_flame: Tiếng ngọn đuốc bùng cháy + âm trầm cộng hưởng (Torch flame ignite)
 */
function playStreakFlame(): void {
  const now = Tone.now();

  // Fire whoosh burst
  const flameNoise = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.08, decay: 0.35, sustain: 0, release: 0.2 },
  }).toDestination();
  flameNoise.volume.value = -6;
  flameNoise.triggerAttackRelease('4n', now);

  // Warm resonant low hum
  const hum = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.05, decay: 0.5, sustain: 0.2, release: 0.4 },
  }).toDestination();
  hum.volume.value = -10;
  hum.triggerAttackRelease('F2', '2n', now + 0.04);

  setTimeout(() => {
    flameNoise.dispose();
    hum.dispose();
  }, 1500);
}

/**
 * 11. scroll_open: Mở cuộn da / Khóa giáp sắt (Parchment unroll / armor clack)
 */
function playScrollOpen(): void {
  const now = Tone.now();

  // Parchment friction swoop
  const swoop = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.25, sustain: 0, release: 0.1 },
  }).toDestination();
  swoop.volume.value = -10;
  swoop.triggerAttackRelease('A3', '8n', now);

  // Armor seal lock click
  const lock = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 1.5,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 },
  }).toDestination();
  lock.volume.value = -8;
  lock.triggerAttackRelease('E4', '16n', now + 0.1);

  // Gentle chime confirmation
  const chime = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 },
  }).toDestination();
  chime.volume.value = -14;
  chime.triggerAttackRelease(['C5', 'G5'], '8n', now + 0.14);

  setTimeout(() => {
    swoop.dispose();
    lock.dispose();
    chime.dispose();
  }, 900);
}

/**
 * 12. error_block: Cảnh báo trầm đục (Muffled warning thud)
 */
function playErrorBlock(): void {
  const now = Tone.now();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.22, sustain: 0, release: 0.1 },
  }).toDestination();
  synth.volume.value = -6;

  // Dissonant low pair
  synth.triggerAttackRelease(['Db2', 'D2'], '8n', now);

  setTimeout(() => synth.dispose(), 600);
}

/**
 * Main Central Audio Engine Dispatcher
 */
export async function playSound(type: SoundType, enabled = true): Promise<void> {
  if (!enabled || isMuted || typeof window === 'undefined') return;

  const isReady = await ensureToneRunning();
  if (!isReady) return;

  try {
    switch (type) {
      case 'ui_click':
        playUiClick();
        break;
      case 'quest_create':
        playQuestCreate();
        break;
      case 'quest_easy':
        playQuestEasy();
        break;
      case 'quest_medium':
        playQuestMedium();
        break;
      case 'quest_hard':
        playQuestHard();
        break;
      case 'quest_boss':
        playQuestBoss();
        break;
      case 'rank_up':
        playRankUp();
        break;
      case 'coin_purchase':
        playCoinPurchase();
        break;
      case 'item_use':
        playItemUse();
        break;
      case 'streak_flame':
        playStreakFlame();
        break;
      case 'scroll_open':
        playScrollOpen();
        break;
      case 'error_block':
        playErrorBlock();
        break;
    }
  } catch (err) {
    console.debug('Error in playSound:', err);
  }
}

// ============================================================================
// CONTINUOUS DARK AMBIENT SOUNDSCAPE FOR FAE FOCUS (Castle Rain, Forge, Abyss)
// ============================================================================

interface AmbientController {
  currentType: AmbientType;
  nodes: {
    noise?: Tone.Noise;
    filter?: Tone.Filter;
    gain?: Tone.Gain;
    osc1?: Tone.Oscillator;
    osc2?: Tone.Oscillator;
  };
  intervalId?: NodeJS.Timeout | null;
}

let ambientSessionToken = 0;

const ambientState: AmbientController = {
  currentType: 'off',
  nodes: {},
  intervalId: null,
};

/**
 * Stop active ambient soundscape immediately or smoothly with fade out.
 * Guaranteed to clean up all Web Audio nodes and prevent orphaned background sound.
 */
export function stopFocusAmbient(fadeDuration = 0.5): void {
  if (typeof window === 'undefined') return;

  // Invalidate any in-flight ambient starts
  ambientSessionToken++;
  ambientState.currentType = 'off';

  if (ambientState.intervalId) {
    clearInterval(ambientState.intervalId);
    ambientState.intervalId = null;
  }

  // Atomically detach existing nodes so any future start won't be wiped out
  const nodesToClean = { ...ambientState.nodes };
  ambientState.nodes = {};

  const disposeNodes = () => {
    try {
      nodesToClean.noise?.stop();
      nodesToClean.noise?.disconnect();
      nodesToClean.noise?.dispose();
    } catch (e) {}

    try {
      nodesToClean.osc1?.stop();
      nodesToClean.osc1?.disconnect();
      nodesToClean.osc1?.dispose();
    } catch (e) {}

    try {
      nodesToClean.osc2?.stop();
      nodesToClean.osc2?.disconnect();
      nodesToClean.osc2?.dispose();
    } catch (e) {}

    try {
      nodesToClean.filter?.disconnect();
      nodesToClean.filter?.dispose();
    } catch (e) {}

    try {
      nodesToClean.gain?.disconnect();
      nodesToClean.gain?.dispose();
    } catch (e) {}
  };

  if (fadeDuration <= 0.05) {
    // Immediate silence & cleanup without delay
    try {
      if (nodesToClean.gain) {
        nodesToClean.gain.gain.setValueAtTime(0, Tone.now());
      }
    } catch (e) {}
    disposeNodes();
  } else {
    // Smooth fade out
    try {
      if (nodesToClean.gain) {
        nodesToClean.gain.gain.rampTo(0, fadeDuration);
      }
    } catch (e) {
      try {
        nodesToClean.gain?.gain.setValueAtTime(0, Tone.now());
      } catch (err) {}
    }
    setTimeout(disposeNodes, (fadeDuration + 0.05) * 1000);
  }
}

/**
 * Start or Switch continuous Dark Ambient Soundscape for Fae Focus
 */
export async function startFocusAmbient(
  type: AmbientType,
  volumePercent = 70,
  fadeDuration = 0.8
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (type === 'off') {
    stopFocusAmbient(fadeDuration);
    return;
  }

  // If already playing the same ambient and active nodes exist, keep playing
  if (ambientState.currentType === type && ambientState.nodes.gain) {
    return;
  }

  // Cleanly stop any existing ambient sound immediately
  stopFocusAmbient(0.05);

  ambientSessionToken++;
  const thisSession = ambientSessionToken;
  ambientState.currentType = type;

  const isReady = await ensureToneRunning();
  // Check if session was cancelled or superseded while awaiting Tone.start()
  if (!isReady || ambientSessionToken !== thisSession || ambientState.currentType !== type) {
    return;
  }

  // Master Gain for Ambient with initial 0 for smooth fade-in
  const ambientGain = new Tone.Gain(0).toDestination();
  const targetGain = Math.max(0.01, Math.min(0.35, (volumePercent / 100) * 0.25));

  try {
    if (type === 'rain') {
      // 🌧️ Mưa Thành Cổ (Castle Rain): Pink noise qua bandpass/lowpass filter
      const filter = new Tone.Filter({
        frequency: 850,
        type: 'lowpass',
        rolloff: -12,
      }).connect(ambientGain);

      const noise = new Tone.Noise('pink').connect(filter);
      noise.start();

      if (ambientSessionToken !== thisSession || ambientState.currentType !== type) {
        try {
          noise.stop();
          noise.disconnect();
          noise.dispose();
          filter.disconnect();
          filter.dispose();
          ambientGain.disconnect();
          ambientGain.dispose();
        } catch (e) {}
        return;
      }

      ambientState.nodes = { noise, filter, gain: ambientGain };
      ambientGain.gain.rampTo(targetGain, fadeDuration);
    } else if (type === 'hearth') {
      // 🔥 Lửa Trại Hầm Rượu / Lò Rèn (Forge Hearth): Brown noise + gentle low rumble & random crackle
      const filter = new Tone.Filter({
        frequency: 420,
        type: 'lowpass',
        rolloff: -24,
      }).connect(ambientGain);

      const noise = new Tone.Noise('brown').connect(filter);
      noise.start();

      if (ambientSessionToken !== thisSession || ambientState.currentType !== type) {
        try {
          noise.stop();
          noise.disconnect();
          noise.dispose();
          filter.disconnect();
          filter.dispose();
          ambientGain.disconnect();
          ambientGain.dispose();
        } catch (e) {}
        return;
      }

      ambientState.nodes = { noise, filter, gain: ambientGain };
      ambientGain.gain.rampTo(targetGain * 1.2, fadeDuration);

      // Random gentle hearth spark crackles
      ambientState.intervalId = setInterval(() => {
        if (ambientSessionToken !== thisSession || ambientState.currentType !== 'hearth') return;
        if (Math.random() > 0.45) {
          const crackle = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
          }).connect(ambientGain);
          crackle.volume.value = -16;
          crackle.triggerAttackRelease('64n');
          setTimeout(() => {
            try {
              crackle.disconnect();
              crackle.dispose();
            } catch (e) {}
          }, 100);
        }
      }, 700);
    } else if (type === 'abyss') {
      // 🌌 Gió Hú Vực Thẳm / Silent Void (Binaural Focus Drone ~70Hz & ~74Hz)
      const filter = new Tone.Filter({
        frequency: 250,
        type: 'lowpass',
      }).connect(ambientGain);

      const osc1 = new Tone.Oscillator(70, 'sine').connect(filter);
      const osc2 = new Tone.Oscillator(74, 'sine').connect(filter);

      osc1.start();
      osc2.start();

      if (ambientSessionToken !== thisSession || ambientState.currentType !== type) {
        try {
          osc1.stop();
          osc1.disconnect();
          osc1.dispose();
          osc2.stop();
          osc2.disconnect();
          osc2.dispose();
          filter.disconnect();
          filter.dispose();
          ambientGain.disconnect();
          ambientGain.dispose();
        } catch (e) {}
        return;
      }

      ambientState.nodes = { osc1, osc2, filter, gain: ambientGain };
      ambientGain.gain.rampTo(targetGain * 0.9, fadeDuration);
    }
  } catch (err) {
    console.debug('Error starting ambient sound:', err);
  }
}
