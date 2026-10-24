// "Lắng đọng": a slow, full-screen slideshow. Each photo drifts (Ken Burns) and cross-fades into the next.
// Usage: startReverie(listOfPhotos, { shuffle: true, startAt: photo })

import { h, photoUrl } from '../core/dom.js';
import { albumOf, shuffle } from '../core/data.js';

const SLIDE_MS = 8000;
let root = null;

export function startReverie(photos, { shuffle: doShuffle = true, startAt = null } = {}) {
  if (!photos.length || root) return;

  let order = doShuffle ? shuffle(photos) : [...photos];
  if (startAt) order = [startAt, ...order.filter((p) => p !== startAt)];

  let i = -1;
  let front = 0;
  let timer = null;
  let paused = false;
  let idle = null;
  const opener = document.activeElement;

  const layers = [h('img', { class: 'reverie__layer', alt: '' }), h('img', { class: 'reverie__layer', alt: '' })];
  const name = h('span', { class: 'reverie__name' });
  const meta = h('span', { class: 'reverie__meta' });
  const story = h('span', { class: 'reverie__story' });
  const progress = h('span', { class: 'reverie__progress-fill' });
  const pauseBtn = h('button', { class: 'reverie__btn', 'aria-label': 'Tạm dừng', onClick: () => setPaused(!paused) }, '❚❚');

  root = h('div', { class: 'reverie', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Chế độ lắng đọng', style: { '--dur': `${SLIDE_MS}ms` } },
    ...layers,
    h('div', { class: 'reverie__vignette' }),
    h('div', { class: 'reverie__caption' }, name, meta, story),
    h('div', { class: 'reverie__ui' },
      h('button', { class: 'reverie__btn', 'aria-label': 'Ảnh trước', onClick: () => step(-1) }, '‹'),
      pauseBtn,
      h('button', { class: 'reverie__btn', 'aria-label': 'Ảnh sau', onClick: () => step(1) }, '›'),
      h('button', { class: 'reverie__btn', 'aria-label': 'Thoát', onClick: stop }, '×')),
    h('div', { class: 'reverie__progress' }, progress));
  document.body.append(root);
  document.documentElement.classList.add('is-locked');
  requestAnimationFrame(() => root.classList.add('is-open'));

  async function show(n) {
    i = (n + order.length) % order.length;
    const p = order[i];
    const next = layers[1 - front];
    next.src = photoUrl(p.src);
    try { await next.decode(); } catch { /* show anyway */ }

    // Random drift so no two slides move alike.
    next.style.setProperty('--kx', `${(Math.random() - 0.5) * 6}%`);
    next.style.setProperty('--ky', `${(Math.random() - 0.5) * 6}%`);
    next.style.setProperty('--ks', (1.08 + Math.random() * 0.08).toFixed(3));
    next.classList.remove('is-active');
    void next.offsetWidth;
    next.classList.add('is-active');
    layers[front].classList.remove('is-active');
    front = 1 - front;

    const album = albumOf(p);
    name.textContent = p.album;
    meta.textContent = [album?.dates, album?.place].filter(Boolean).join(' · ');
    story.textContent = album?.story ?? '';
    root.classList.remove('is-changing');
    void root.offsetWidth;
    root.classList.add('is-changing'); // restarts the caption + progress animations
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (!paused) timer = setTimeout(() => show(i + 1), SLIDE_MS);
  }

  function step(d) { show(i + d); }

  function setPaused(value) {
    paused = value;
    root.classList.toggle('is-paused', paused);
    pauseBtn.textContent = paused ? '▶' : '❚❚';
    pauseBtn.setAttribute('aria-label', paused ? 'Tiếp tục' : 'Tạm dừng');
    if (paused) clearTimeout(timer); else schedule();
  }

  function wake() {
    root.classList.remove('is-idle');
    clearTimeout(idle);
    idle = setTimeout(() => root.classList.add('is-idle'), 3000);
  }

  function onKey(e) {
    if (e.key === 'Escape') stop();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === ' ') { e.preventDefault(); setPaused(!paused); }
  }

  function stop() {
    clearTimeout(timer);
    clearTimeout(idle);
    document.removeEventListener('keydown', onKey);
    root.removeEventListener('pointermove', wake);
    root.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked');
    const el = root;
    root = null;
    setTimeout(() => el.remove(), 700);
    opener?.focus?.();
  }

  document.addEventListener('keydown', onKey);
  root.addEventListener('pointermove', wake);
  wake();
  show(0);
}
