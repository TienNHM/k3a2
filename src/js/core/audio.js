// Sound engine (Web Audio). Everything is synthesised, so there are no audio files to host or license.
//
//   enable() / disable() / toggle()   – must be called from a user gesture the first time
//   setMood('wistful' | 'bright' | 'tender' | 'warm')   – picks the piece that plays
//   sfx('tick' | 'chime' | 'whoosh' | 'door' | 'shutter' | 'paper', { gain })
//   onChange(fn)                      – fires when sound is switched on or off
//   preview(mood, bars)               – renders a piece offline and returns its loudness (for tests)
//
// The music is a small generative chamber piece: a string section holds a four-chord progression,
// a harp arpeggiates it, a violin sings one note at a time, a cello doubles the root. Chords are all
// plain major/minor triads and the melody only uses chord tones, so it always sounds consonant.
//
// Sound is OFF until the visitor opts in; the choice is remembered. Browsers block audio without a
// gesture, so when the saved choice is "on" we wait for the first click/key on a page, then start.

import { audioConfig } from '../../content/audio.js';

const KEY = 'k3a2:sound';
const BEATS_PER_BAR = 4;

/** Each mood = a tempo and a four-bar progression of [root MIDI note, 'maj' | 'min']. */
const MOODS = {
  wistful: { bpm: 56, chords: [[57, 'min'], [53, 'maj'], [48, 'maj'], [55, 'maj']] }, // Am F C G
  bright: { bpm: 76, chords: [[50, 'maj'], [57, 'maj'], [59, 'min'], [55, 'maj']] }, // D A Bm G
  tender: { bpm: 60, chords: [[53, 'maj'], [48, 'maj'], [50, 'min'], [58, 'maj']] }, // F C Dm Bb
  warm: { bpm: 64, chords: [[55, 'maj'], [50, 'maj'], [52, 'min'], [48, 'maj']] }, // G D Em C
};
const TRIAD = { maj: [0, 4, 7], min: [0, 3, 7] };

const midi = (n) => 440 * 2 ** ((n - 69) / 12);
const rand = (a, b) => a + Math.random() * (b - a);
const bus = new EventTarget();
const lastPlayed = {};

let ctx = null;
let graph = null;
let enabled = false;
let mood = 'wistful';
let composer = null;
let music = null;

export const isEnabled = () => enabled;
export const onChange = (fn) => bus.addEventListener('change', fn);
const emit = () => bus.dispatchEvent(new Event('change'));

const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } };
/** True when the visitor chose "on" on a previous page or visit. */
export const preferred = () => read() === 'on';

// ---- Audio graph: voices -> dry + reverb -> gentle compressor -> speakers ----

function buildGraph(c) {
  const master = c.createGain();
  master.gain.value = 0;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 18;
  comp.ratio.value = 3;
  master.connect(comp);
  comp.connect(c.destination);

  const dry = c.createGain();
  dry.connect(master);

  // A small concert hall: decaying noise as an impulse response.
  const reverb = c.createConvolver();
  const len = Math.floor(c.sampleRate * 2.4);
  const impulse = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.2;
  }
  reverb.buffer = impulse;
  const wet = c.createGain();
  wet.gain.value = 0.5;
  wet.connect(reverb);
  reverb.connect(master);

  const noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const n = noise.getChannelData(0);
  for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;

  return { c, master, dry, wet, noise };
}

/** Routes a node to the speakers (dry) and to the hall (wet). */
function send(g, node, wetAmount = 0.3) {
  node.connect(g.dry);
  const w = g.c.createGain();
  w.gain.value = wetAmount;
  node.connect(w);
  w.connect(g.wet);
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  graph = buildGraph(ctx);
  return ctx;
}

// ---- Instruments (each schedules its own notes; `out` is where they are sent) ----

/** Warm string section voice: three slightly detuned saws, slow bloom, long release. */
function strings(g, out, note, t, dur, gain) {
  const c = g.c;
  const f = midi(note);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(f * 4, 2600);
  lp.Q.value = 0.4;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(gain, t + 1.1);
  env.gain.setValueAtTime(gain, t + dur);
  env.gain.linearRampToValueAtTime(0.0001, t + dur + 1.8);
  lp.connect(env);
  env.connect(out);
  for (const detune of [-8, 0, 8]) {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 1.9);
  }
}

/** Harp pluck: harmonic partials with a quick attack and a natural decay. */
function pluck(g, out, note, t, gain) {
  const c = g.c;
  const f = midi(note);
  [[1, 1], [2, 0.28], [3, 0.1], [4, 0.04]].forEach(([mult, amp], i) => {
    const o = c.createOscillator();
    o.type = i === 0 ? 'triangle' : 'sine';
    o.frequency.value = f * mult;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain * amp, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.5 / (1 + i * 0.6));
    o.connect(env);
    env.connect(out);
    o.start(t);
    o.stop(t + 1.6);
  });
}

/** Solo violin: one note at a time, singing, with a little vibrato. */
function lead(g, out, note, t, dur, gain) {
  const c = g.c;
  const f = midi(note);
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = f;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(f * 3, 2400);
  lp.Q.value = 0.5;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(gain, t + 0.35);
  env.gain.setValueAtTime(gain, t + dur);
  env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.9);
  const vib = c.createOscillator();
  vib.frequency.value = 5.3;
  const depth = c.createGain();
  depth.gain.value = 7; // cents
  vib.connect(depth);
  depth.connect(o.detune);
  o.connect(lp);
  lp.connect(env);
  env.connect(out);
  o.start(t);
  vib.start(t);
  o.stop(t + dur + 1);
  vib.stop(t + dur + 1);
}

/** Cello: a soft low root. */
function cello(g, out, note, t, dur, gain) {
  const c = g.c;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.value = midi(note);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(gain, t + 0.15);
  env.gain.setValueAtTime(gain, t + dur);
  env.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
  o.connect(lp);
  lp.connect(env);
  env.connect(out);
  o.start(t);
  o.stop(t + dur + 1.3);
}

// ---- The piece ----

/** Chord tones of the triad folded into the violin's range (C5–D6). */
function leadNotes(root, quality) {
  const notes = [];
  for (const off of TRIAD[quality]) {
    let n = root + off;
    while (n < 72) n += 12;
    while (n > 84) n -= 12;
    notes.push(n);
    if (n + 12 <= 88) notes.push(n + 12);
  }
  return notes;
}

/** The violin moves by small steps: pick one of the two nearest chord tones, avoiding a repeat. */
function nextLeadNote(root, quality, last) {
  const near = leadNotes(root, quality)
    .filter((n) => n !== last)
    .sort((a, b) => Math.abs(a - last) - Math.abs(b - last));
  return near[Math.random() < 0.7 ? 0 : Math.min(1, near.length - 1)];
}

/** Schedules one bar of the piece starting at time t0 on node `out`. */
function scheduleBar(g, out, m, barIndex, t0, state) {
  const [root, quality] = m.chords[barIndex % m.chords.length];
  const third = TRIAD[quality][1];
  const beat = 60 / m.bpm;
  const bar = beat * BEATS_PER_BAR;

  // Strings hold the chord for the whole bar; the next bar blooms in over the tail of this one.
  [0, 7, 12, third + 12].forEach((off) => strings(g, out, root + off, t0, bar, 0.018));
  cello(g, out, root - 12 < 40 ? root : root - 12, t0, bar, 0.16);

  // Harp: eight eighth-notes rising and falling through the chord.
  const arp = [root + 12, root + 19, root + 24, root + 24 + third];
  [0, 1, 2, 3, 2, 1, 2, 1].forEach((ix, k) => {
    const accent = k === 0 ? 0.11 : k % 2 ? 0.045 : 0.065;
    pluck(g, out, arp[ix], t0 + k * (beat / 2) + rand(0, 0.012), accent * rand(0.85, 1.15));
  });

  // Violin sings on beats 1 and 3, and rests for two bars in every eight so the piece breathes.
  if (barIndex % 8 < 6) {
    for (const at of [0, 2]) {
      state.last = nextLeadNote(root, quality, state.last);
      lead(g, out, state.last, t0 + at * beat, beat * 2.1, 0.055);
    }
  }
}

function startComposer(m) {
  const c = ctx;
  const g = graph;
  const out = c.createGain();
  out.gain.value = 0;
  send(g, out, 0.35);
  out.gain.linearRampToValueAtTime(0.9, c.currentTime + 2.5);

  const barSeconds = (60 / m.bpm) * BEATS_PER_BAR;
  const state = { last: 76 };
  let bar = 0;
  let next = c.currentTime + 0.2;
  const tick = () => {
    while (next < c.currentTime + 1.5) {
      scheduleBar(g, out, m, bar, next, state);
      bar += 1;
      next += barSeconds;
    }
  };
  tick();
  const timer = setInterval(tick, 400);

  return {
    stop() {
      clearInterval(timer);
      const now = c.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 2.2);
      setTimeout(() => out.disconnect(), 4500); // let the notes already scheduled ring out unheard
    },
  };
}

function startAmbience() {
  if (audioConfig.music) {
    if (!music) {
      const el = new Audio(audioConfig.music.src);
      el.loop = true;
      const source = ctx.createMediaElementSource(el);
      const g = ctx.createGain();
      g.gain.value = 0.8;
      source.connect(g);
      g.connect(graph.master);
      music = el;
    }
    music.play().catch(() => {});
    return;
  }
  composer?.stop();
  composer = startComposer(MOODS[mood]);
}

function stopAmbience() {
  composer?.stop();
  composer = null;
  music?.pause();
}

// ---- Public API ----

export async function enable() {
  const c = ensure();
  if (!c) return false;
  try { await c.resume(); } catch { /* blocked */ }
  if (c.state !== 'running') return false;
  enabled = true;
  write('on');
  const t = c.currentTime;
  graph.master.gain.cancelScheduledValues(t);
  graph.master.gain.setValueAtTime(graph.master.gain.value, t);
  graph.master.gain.linearRampToValueAtTime(audioConfig.volume, t + 1.5);
  startAmbience();
  emit();
  return true;
}

export function disable() {
  write('off');
  if (!enabled) return emit();
  enabled = false;
  const t = ctx.currentTime;
  graph.master.gain.cancelScheduledValues(t);
  graph.master.gain.setValueAtTime(graph.master.gain.value, t);
  graph.master.gain.linearRampToValueAtTime(0, t + 0.8);
  setTimeout(() => { if (!enabled) { stopAmbience(); ctx.suspend(); } }, 1000);
  emit();
}

export const toggle = () => (enabled ? disable() : enable());

export function setMood(name) {
  const next = MOODS[name] ? name : 'wistful';
  if (next === mood) return;
  mood = next;
  if (enabled && !music) startAmbience(); // the old piece fades out while the new one fades in
}

/** If the visitor already opted in, start at their first interaction on this page. */
export function resumeOnGesture() {
  if (!preferred() || enabled) return;
  const events = ['pointerdown', 'keydown'];
  const go = (e) => {
    // A press on the sound button itself is handled by its own click handler; counting it here too would turn sound on and straight off.
    if (e.target instanceof Element && e.target.closest('.nav__sound')) return;
    events.forEach((name) => window.removeEventListener(name, go));
    enable();
  };
  events.forEach((name) => window.addEventListener(name, go));
}

/** Renders `bars` bars of a mood offline and returns its loudness. Handy for checking levels without speakers. */
export async function preview(name = 'wistful', bars = 6) {
  const m = MOODS[name] ?? MOODS.wistful;
  const seconds = (60 / m.bpm) * BEATS_PER_BAR * bars + 3;
  const offline = new OfflineAudioContext(2, Math.floor(44100 * seconds), 44100);
  const g = buildGraph(offline);
  g.master.gain.value = audioConfig.volume;
  const out = offline.createGain();
  out.gain.value = 0.9;
  send(g, out, 0.35);
  const state = { last: 76 };
  for (let b = 0; b < bars; b++) scheduleBar(g, out, m, b, b * (60 / m.bpm) * BEATS_PER_BAR, state);
  const buffer = await offline.startRendering();
  let peak = 0;
  let sum = 0;
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if (a > peak) peak = a; sum += data[i] * data[i]; }
  return { mood: name, seconds: Number(seconds.toFixed(1)), peak: Number(peak.toFixed(3)), rms: Number(Math.sqrt(sum / data.length).toFixed(4)) };
}

// ---- Sound effects ----

/** Chord tones of the current mood's home chord, for effects that should sound "in key". */
function homeChord() {
  const [root, quality] = MOODS[mood].chords[0];
  return TRIAD[quality].map((off) => root + 24 + off);
}

const recipes = {
  tick({ gain = 0.05 }) {
    const g = graph;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const env = ctx.createGain();
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.04);
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(env);
    send(g, env, 0.15);
    o.start(t);
    o.stop(t + 0.08);
  },
  /** A single harp note from the home chord. */
  chime({ gain = 0.08 }) {
    const notes = homeChord();
    const out = ctx.createGain();
    send(graph, out, 0.45);
    pluck(graph, out, notes[Math.floor(Math.random() * notes.length)], ctx.currentTime, gain);
  },
  whoosh({ gain = 0.07 }) {
    const g = graph;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = g.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.7;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(2200, t + 0.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.2);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    s.connect(f);
    f.connect(env);
    send(g, env, 0.2);
    s.start(t);
    s.stop(t + 0.7);
  },
  /** The gate opens on a warm swell of strings and a rising harp. */
  door({ gain = 1 }) {
    const g = graph;
    const t = ctx.currentTime;
    const [root, quality] = MOODS[mood].chords[0];
    const out = ctx.createGain();
    out.gain.value = gain;
    send(g, out, 0.5);
    [0, 7, 12, TRIAD[quality][1] + 12].forEach((off) => strings(g, out, root + off, t, 1.4, 0.03));
    [0, 1, 2, 3, 4].forEach((k) => pluck(g, out, root + 24 + [0, 4, 7, 12, 16][k] - (quality === 'min' && (k === 1 || k === 4) ? 1 : 0), t + 0.25 + k * 0.13, 0.08));
  },
  shutter({ gain = 0.07 }) {
    const g = graph;
    const t = ctx.currentTime;
    for (const at of [0, 0.07]) {
      const s = ctx.createBufferSource();
      s.buffer = g.noise;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 2200;
      const env = ctx.createGain();
      env.gain.setValueAtTime(gain, t + at);
      env.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.03);
      s.connect(f);
      f.connect(env);
      send(g, env, 0.1);
      s.start(t + at);
      s.stop(t + at + 0.05);
    }
  },
  paper({ gain = 0.04 }) {
    const g = graph;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = g.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 3200;
    f.Q.value = 0.5;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    s.connect(f);
    f.connect(env);
    send(g, env, 0.1);
    s.start(t);
    s.stop(t + 0.3);
  },
};

/** Plays a short effect if sound is on. Effects of the same name are rate-limited (hover spam). */
export function sfx(name, opts = {}) {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const now = performance.now();
  if (now - (lastPlayed[name] ?? 0) < 220) return;
  lastPlayed[name] = now;
  recipes[name]?.(opts);
}
