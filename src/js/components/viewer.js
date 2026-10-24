// Full-screen photo viewer. Usage: openViewer(listOfPhotos, startIndex). Built lazily on first use.

import { h, photoUrl } from '../core/dom.js';
import { albumOf, catalogNo } from '../core/data.js';
import { startReverie } from './reverie.js';
import { sfx } from '../core/audio.js';

let root, img, bg, no, title, meta, count;
let list = [];
let index = 0;
let opener = null;

function build() {
  img = h('img', { class: 'viewer__img', alt: '' });
  bg = h('div', { class: 'viewer__bg' });
  no = h('span', { class: 'plate__no' });
  title = h('span', { class: 'plate__title' });
  meta = h('span', { class: 'plate__meta' });
  count = h('span', { class: 'viewer__count' });

  root = h('div', { class: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Xem ảnh' },
    bg,
    h('button', { class: 'viewer__close', 'aria-label': 'Đóng', onClick: close }, '×'),
    h('button', { class: 'viewer__nav viewer__nav--prev', 'aria-label': 'Ảnh trước', onClick: () => go(-1) }, '‹'),
    h('figure', { class: 'viewer__stage' }, img,
      h('figcaption', { class: 'plate' }, no, title, meta)),
    h('button', { class: 'viewer__nav viewer__nav--next', 'aria-label': 'Ảnh sau', onClick: () => go(1) }, '›'),
    h('div', { class: 'viewer__bar' }, count,
      h('button', { class: 'btn btn--ghost', onClick: reverie }, 'Lắng đọng ›')));
  document.body.append(root);

  root.addEventListener('click', (e) => { if (e.target === root || e.target === bg) close(); });
  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });

  // Swipe
  let x0 = null;
  root.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  root.addEventListener('pointerup', (e) => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  });
}

function render() {
  const p = list[index];
  const album = albumOf(p);
  img.classList.remove('is-in');
  void img.offsetWidth; // restart the entrance animation
  img.src = photoUrl(p.src);
  img.alt = p.album;
  img.classList.add('is-in');
  bg.style.backgroundImage = `url("${photoUrl(p.thumb)}")`;
  no.textContent = catalogNo(index + 1);
  title.textContent = p.album;
  meta.textContent = [album?.dates, album?.place].filter(Boolean).join(' · ');
  count.textContent = `${index + 1} / ${list.length}`;
  for (const n of [list[(index + 1) % list.length], list[(index - 1 + list.length) % list.length]]) {
    new Image().src = photoUrl(n.src);
  }
}

function go(step) {
  index = (index + step + list.length) % list.length;
  sfx('tick');
  render();
}

function close() {
  root.classList.remove('is-open');
  document.documentElement.classList.remove('is-locked');
  opener?.focus?.();
}

function reverie() {
  const current = list[index];
  close();
  startReverie(list, { startAt: current });
}

export function openViewer(photos, start = 0) {
  if (!photos.length) return;
  if (!root) build();
  list = photos;
  index = Math.max(0, Math.min(start, photos.length - 1));
  opener = document.activeElement;
  sfx('shutter');
  render();
  root.classList.add('is-open');
  document.documentElement.classList.add('is-locked');
  root.querySelector('.viewer__close').focus();
}
