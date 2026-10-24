// Sound engine (Web Audio). Everything is synthesised, so there are no audio files to host or license.
//
//   enable() / disable() / toggle()   – must be called from a user gesture the first time
//   setMood('wistful' | 'bright' | 'tender' | 'warm')   – retunes the ambient pad and bells
//   sfx('tick' | 'chime' | 'whoosh' | 'door' | 'shutter' | 'paper', { gain })
//   onChange(fn)                      – fires when sound is switched on or off
//
// Sound is OFF until the visitor opts in; the choice is remembered. Browsers block audio without a
// gesture, so when the saved choice is "on" we wait for the first click/key on a page, then start.

import { audioConfig } from '../../content/audio.js';

const KEY = 'k3a2:sound';
const PAD_GAIN = 0.5;

/** Each mood = a chord for the pad + a scale the bells pick from. `root` is a MIDI note. */
const MOODS = {
  wistful: { root: 57, chord: [0, 7, 12, 15, 19], scale: [0, 3, 5, 7, 10], bellEvery: [6, 12] },
  bright: { root: 62, chord: [0, 7, 12, 16, 19], scale: [0, 2, 4, 7, 9], bellEvery: [3, 7] },
  tender: { root: 53, chord: [0, 7, 11, 16, 19], scale: [0, 2, 4, 7, 9], bellEvery: [5, 10] },
  warm: { root: 55, chord: [0, 7, 14, 16, 19], scale: [0, 2, 4, 7, 9], bellEvery: [5, 9] },
};

const midi = (n) => 440 * 2 ** ((n - 69) / 12);
const bus = new EventTarget();
const lastPlayed = {};

let ctx = null;
let master = null;
let dry = null;
let wet = null;
let noiseBuf = null;
let enabled = false;
let mood = 'wistful';
let pad = null;
let music = null;
let bellTimer = null;

export const isEnabled = () => enabled;
export const onChange = (fn) => bus.addEventListener('change', fn);
const emit = () => bus.dispatchEvent(new Event('change'));

const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } };
/** True when the visitor chose "on" on a previous page or visit. */
export const preferred = () => read() === 'on';

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  dry = ctx.createGain();
  dry.connect(master);

  // A synthetic room: decaying noise as an impulse response.
  const reverb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 3.2);
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
  }
  reverb.buffer = impulse;
  wet = ctx.createGain();
  wet.gain.value = 0.55;
  wet.connect(reverb);
  reverb.connect(master);

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const n = noiseBuf.getChannelData(0);
  for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  return ctx;
}

const send = (node, wetAmount = 0.3) => {
  node.connect(dry);
  const w = ctx.createGain();
  w.gain.value = wetAmount;
  node.connect(w);
  w.connect(wet);
};

function noiseSource(loop = false) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = loop;
  return s;
}

// ---- Ambience ----

function startPad(m) {
  const out = ctx.createGain();
  out.gain.value = 0;
  send(out, 0.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  filter.Q.value = 0.6;
  filter.connect(out);

  // The filter slowly opens and closes, so the pad "breathes".
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 260;
  lfo.connect(lfoDepth);
  lfoDepth.connect(filter.frequency);
  lfo.start();

  const sources = [lfo];
  m.chord.forEach((semi, i) => {
    for (const detune of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = midi(m.root + semi - (i === 0 ? 12 : 0));
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = 0.16 / m.chord.length;
      o.connect(g);
      g.connect(filter);
      o.start();
      sources.push(o);
    }
  });

  // Faint room tone.
  const tone = noiseSource(true);
  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 380;
  const toneGain = ctx.createGain();
  toneGain.gain.value = 0.02;
  tone.connect(toneFilter);
  toneFilter.connect(toneGain);
  toneGain.connect(out);
  tone.start();
  sources.push(tone);

  const t = ctx.currentTime;
  out.gain.linearRampToValueAtTime(PAD_GAIN, t + 3);
  return {
    stop() {
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 2);
      setTimeout(() => { sources.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } }); out.disconnect(); }, 2300);
    },
  };
}

function bell({ gain = 0.06, note } = {}) {
  const m = MOODS[mood];
  const semi = note ?? m.scale[Math.floor(Math.random() * m.scale.length)] + (Math.random() < 0.5 ? 12 : 24);
  const f = midi(m.root + semi);
  const t = ctx.currentTime;
  const out = ctx.createGain();
  send(out, 0.7);
  [[1, 1, 3.2], [2.01, 0.35, 1.6], [3.2, 0.15, 0.8]].forEach(([mult, amp, decay]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain * amp, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + decay + 0.1);
  });
}

function scheduleBell() {
  clearTimeout(bellTimer);
  if (!enabled || music) return;
  const [a, b] = MOODS[mood].bellEvery;
  bellTimer = setTimeout(() => { bell({ gain: 0.05 }); scheduleBell(); }, (a + Math.random() * (b - a)) * 1000);
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
      g.connect(master);
      music = el;
    }
    music.play().catch(() => {});
    return;
  }
  pad?.stop();
  pad = startPad(MOODS[mood]);
  scheduleBell();
}

function stopAmbience() {
  clearTimeout(bellTimer);
  pad?.stop();
  pad = null;
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
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(audioConfig.volume, t + 1.5);
  startAmbience();
  emit();
  return true;
}

export function disable() {
  write('off');
  if (!enabled) return emit();
  enabled = false;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + 0.6);
  setTimeout(() => { if (!enabled) { stopAmbience(); ctx.suspend(); } }, 800);
  emit();
}

export const toggle = () => (enabled ? disable() : enable());

export function setMood(name) {
  const next = MOODS[name] ? name : 'wistful';
  if (next === mood) return;
  mood = next;
  if (enabled && !music) startAmbience();
}

/** If the visitor already opted in, start at their first interaction on this page. */
export function resumeOnGesture() {
  if (!preferred() || enabled) return;
  const go = () => { enable(); ['pointerdown', 'keydown'].forEach((e) => window.removeEventListener(e, go)); };
  ['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, go, { once: true }));
}

// ---- Sound effects ----

const recipes = {
  tick({ gain = 0.06 }) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.04);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g);
    send(g, 0.15);
    o.start(t);
    o.stop(t + 0.08);
  },
  chime({ gain = 0.07 }) { bell({ gain }); },
  whoosh({ gain = 0.1 }) {
    const t = ctx.currentTime;
    const s = noiseSource();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(260, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    s.connect(f);
    f.connect(g);
    send(g, 0.2);
    s.start(t);
    s.stop(t + 0.7);
  },
  door({ gain = 0.22 }) {
    const t = ctx.currentTime;
    const s = noiseSource();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(220, t);
    f.frequency.linearRampToValueAtTime(700, t + 1.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain * 0.6, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    s.connect(f);
    f.connect(g);
    send(g, 0.5);
    s.start(t);
    s.stop(t + 1.6);
    for (const at of [0, 1.05]) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.frequency.setValueAtTime(90, t + at);
      o.frequency.exponentialRampToValueAtTime(45, t + at + 0.3);
      og.gain.setValueAtTime(gain, t + at);
      og.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.4);
      o.connect(og);
      send(og, 0.4);
      o.start(t + at);
      o.stop(t + at + 0.45);
    }
  },
  shutter({ gain = 0.09 }) {
    const t = ctx.currentTime;
    for (const at of [0, 0.07]) {
      const s = noiseSource();
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t + at);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.035);
      s.connect(f);
      f.connect(g);
      send(g, 0.1);
      s.start(t + at);
      s.stop(t + at + 0.05);
    }
  },
  paper({ gain = 0.06 }) {
    const t = ctx.currentTime;
    const s = noiseSource();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 3200;
    f.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    s.connect(f);
    f.connect(g);
    send(g, 0.1);
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
