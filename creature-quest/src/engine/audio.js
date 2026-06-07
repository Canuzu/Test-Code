// Prozedurale Retro-Audio-Engine (Web Audio API).
//
// Erzeugt Chiptune-SFX und Hintergrundmusik komplett im Browser – keine
// Binärdateien nötig. Alles ist tonal an den DS-Sound angelehnt: kurze
// Rechteck-/Dreieckwellen für Effekte, geloopte Melodien je Gebiet/Kampf.

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let enabled = true;
let currentTrack = null;     // Name des laufenden Tracks
let musicTimer = null;       // setTimeout-Handle für die Loop
let musicNodes = [];         // aktive Oszillatoren der Musik (zum Stoppen)

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.35;
  musicGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.7;
  sfxGain.connect(masterGain);
  return ctx;
}

// Browser verlangen eine User-Geste, bevor Audio läuft.
export function resumeAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}

export function setEnabled(on) {
  enabled = on;
  if (!on) stopMusic();
  if (masterGain) masterGain.gain.value = on ? 0.6 : 0;
}

export function isEnabled() {
  return enabled;
}

// Note-Name → Frequenz (Hz). Unterstützt z.B. 'A4', 'C#5', 'Gb3'.
const NOTE_BASE = { C: -9, 'C#': -8, Db: -8, D: -7, 'D#': -6, Eb: -6, E: -5, F: -4, 'F#': -3, Gb: -3, G: -2, 'G#': -1, Ab: -1, A: 0, 'A#': 1, Bb: 1, B: 2 };
function freq(note) {
  if (typeof note === 'number') return note;
  if (!note) return 0;
  const m = /^([A-G][#b]?)(\d)$/.exec(note);
  if (!m) return 0;
  const semis = NOTE_BASE[m[1]] + (parseInt(m[2], 10) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

// Ein einzelner Ton mit Hüllkurve.
function tone(f, start, dur, { type = 'square', gain = 0.5, dest = sfxGain, slideTo = null } = {}) {
  if (!ctx || f <= 0) return null;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + dur);
  // schnelle Attack, sanftes Decay
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(dest || sfxGain);
  osc.start(start);
  osc.stop(start + dur + 0.02);
  return osc;
}

// Kurzes Rausch-Burst (für Treffer/Explosionen).
function noise(start, dur, { gain = 0.4, dest = sfxGain } = {}) {
  if (!ctx) return;
  const frames = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(g);
  g.connect(dest || sfxGain);
  src.start(start);
}

// ── Soundeffekte ───────────────────────────────────────────────────────────
const SFX = {
  select() {
    const t = ctx.currentTime;
    tone(freq('E5'), t, 0.08, { type: 'square', gain: 0.4 });
  },
  confirm() {
    const t = ctx.currentTime;
    tone(freq('C5'), t, 0.07, { gain: 0.4 });
    tone(freq('G5'), t + 0.07, 0.1, { gain: 0.4 });
  },
  cancel() {
    const t = ctx.currentTime;
    tone(freq('G4'), t, 0.06, { gain: 0.35 });
    tone(freq('C4'), t + 0.06, 0.1, { gain: 0.35 });
  },
  hit() {
    const t = ctx.currentTime;
    noise(t, 0.16, { gain: 0.4 });
    tone(180, t, 0.16, { type: 'square', gain: 0.3, slideTo: 60 });
  },
  superHit() {
    const t = ctx.currentTime;
    noise(t, 0.26, { gain: 0.5 });
    tone(240, t, 0.26, { type: 'sawtooth', gain: 0.35, slideTo: 50 });
  },
  faint() {
    const t = ctx.currentTime;
    tone(freq('G4'), t, 0.5, { type: 'sine', gain: 0.4, slideTo: freq('G2') });
  },
  levelUp() {
    const t = ctx.currentTime;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.09, 0.13, { gain: 0.4 }));
  },
  catch() {
    const t = ctx.currentTime;
    tone(freq('A4'), t, 0.1, { gain: 0.4 });
    tone(freq('C5'), t + 0.1, 0.1, { gain: 0.4 });
    tone(freq('E5'), t + 0.2, 0.1, { gain: 0.4 });
    tone(freq('A5'), t + 0.3, 0.22, { gain: 0.45 });
  },
  ball() {
    const t = ctx.currentTime;
    tone(freq('E5'), t, 0.06, { gain: 0.35, slideTo: freq('A5') });
  },
  heal() {
    const t = ctx.currentTime;
    ['C5', 'E5', 'G5'].forEach((n, i) => tone(freq(n), t + i * 0.12, 0.18, { type: 'sine', gain: 0.35 }));
  },
  buy() {
    const t = ctx.currentTime;
    tone(freq('C5'), t, 0.07, { gain: 0.35 });
    tone(freq('E5'), t + 0.07, 0.07, { gain: 0.35 });
    tone(freq('C5'), t + 0.14, 0.1, { gain: 0.3 });
  },
  encounter() {
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) tone(i % 2 ? freq('C5') : freq('G4'), t + i * 0.07, 0.06, { type: 'square', gain: 0.4 });
  },
  badge() {
    const t = ctx.currentTime;
    ['C5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(freq(n), t + i * 0.1, 0.16, { gain: 0.4 }));
  },
  bump() {
    const t = ctx.currentTime;
    tone(90, t, 0.08, { type: 'square', gain: 0.25, slideTo: 60 });
  },
};

export function sfx(name) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const fn = SFX[name];
  if (fn) fn();
}

// ── Hintergrundmusik ─────────────────────────────────────────────────────
// Jeder Track ist eine Melodiezeile (Bass folgt automatisch). Sehr simpel,
// aber genug für DS-Atmosphäre. Tempo in Sekunden pro Achtelnote.
const TRACKS = {
  title: {
    tempo: 0.28, wave: 'triangle',
    melody: ['C5', 'E5', 'G5', 'E5', 'F5', 'A5', 'G5', 'E5', 'D5', 'F5', 'E5', 'C5', 'G4', 'C5', 'E5', null],
    bass:   ['C3', null, 'G2', null, 'F2', null, 'C3', null, 'G2', null, 'C3', null, 'G2', null, 'C3', null],
  },
  wiese: {
    tempo: 0.22, wave: 'triangle',
    melody: ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'E5', 'D5', 'C5', 'D5', null, 'G4', null],
    bass:   ['C3', null, 'G2', null, 'A2', null, 'E2', null, 'F2', null, 'C3', null, 'G2', null, 'C3', null],
  },
  wald: {
    tempo: 0.26, wave: 'sine',
    melody: ['A4', 'C5', 'E5', 'C5', 'D5', 'F5', 'E5', 'C5', 'B4', 'D5', 'C5', 'A4', 'E4', 'A4', 'C5', null],
    bass:   ['A2', null, 'E2', null, 'F2', null, 'C3', null, 'G2', null, 'A2', null, 'E2', null, 'A2', null],
  },
  hoehle: {
    tempo: 0.3, wave: 'triangle',
    melody: ['D4', 'F4', 'A4', 'F4', 'G4', 'A4', 'C5', 'A4', 'F4', 'A4', 'G4', 'F4', 'D4', null, 'A3', null],
    bass:   ['D2', null, 'A2', null, 'G2', null, 'C3', null, 'F2', null, 'D2', null, 'A2', null, 'D2', null],
  },
  battle: {
    tempo: 0.16, wave: 'square',
    melody: ['E5', 'E5', 'B4', 'C5', 'D5', 'D5', 'C5', 'B4', 'A4', 'A4', 'C5', 'E5', 'D5', 'C5', 'B4', null],
    bass:   ['A2', 'A2', 'E2', 'E2', 'F2', 'F2', 'C3', 'C3', 'G2', 'G2', 'A2', 'A2', 'E2', 'E2', 'A2', null],
  },
  trainer: {
    tempo: 0.15, wave: 'sawtooth',
    melody: ['G5', 'F5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'A5', 'G5', 'F5', 'E5', 'D5', 'E5', 'C5', null],
    bass:   ['C3', 'C3', 'G2', 'G2', 'A2', 'A2', 'F2', 'F2', 'C3', 'C3', 'G2', 'G2', 'F2', 'F2', 'C3', null],
  },
  town: {
    tempo: 0.24, wave: 'triangle',
    melody: ['G4', 'C5', 'E5', 'G5', 'E5', 'C5', 'F5', 'A5', 'G5', 'E5', 'C5', 'E5', 'D5', 'B4', 'C5', null],
    bass:   ['C3', null, 'E2', null, 'F2', null, 'C3', null, 'G2', null, 'C3', null, 'G2', null, 'C3', null],
  },
};

function scheduleLoop(track) {
  if (!ctx || !enabled) return;
  const t0 = ctx.currentTime + 0.05;
  const step = track.tempo;
  const len = track.melody.length;
  for (let i = 0; i < len; i++) {
    const mt = t0 + i * step;
    const mf = freq(track.melody[i]);
    if (mf) {
      const o = tone(mf, mt, step * 0.9, { type: track.wave, gain: 0.5, dest: musicGain });
      if (o) musicNodes.push(o);
    }
    const bf = freq(track.bass[i]);
    if (bf) {
      const o = tone(bf, mt, step * 1.2, { type: 'triangle', gain: 0.45, dest: musicGain });
      if (o) musicNodes.push(o);
    }
  }
  // nächste Schleife einplanen
  musicTimer = setTimeout(() => {
    musicNodes = musicNodes.filter(() => false);
    scheduleLoop(track);
  }, len * step * 1000);
}

export function playMusic(name) {
  if (!enabled) { currentTrack = name; return; }
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (currentTrack === name && musicTimer) return; // läuft bereits
  stopMusic();
  const track = TRACKS[name];
  if (!track) { currentTrack = null; return; }
  currentTrack = name;
  scheduleLoop(track);
}

export function stopMusic() {
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  musicNodes.forEach((o) => { try { o.stop(); } catch { /* schon gestoppt */ } });
  musicNodes = [];
  currentTrack = null;
}

export function getCurrentTrack() {
  return currentTrack;
}
