// The lobby hero: floating framed photos on a dark stage with pointer parallax and a roaming spotlight.

import { h, svg, photoUrl } from '../core/dom.js';
import { site } from '../../content/site.js';
import { rooms, photos, shuffle } from '../core/data.js';
import { splitChars } from '../core/motion.js';
import { startReverie } from './reverie.js';

const SHAPES = ['arch', 'circle', 'pill', 'arch-tall', 'ring'];

/** One cover per room first, then random fill, so every mood shows up in the lobby. */
function pickArt(n) {
  const picked = rooms.map((r) => r.cover).filter(Boolean);
  const rest = shuffle(photos.filter((p) => !picked.includes(p)));
  return [...picked, ...rest].slice(0, n);
}

export default function mount(el) {
  el.classList.add('hero');
  el.id = 'top';

  const arts = pickArt(SHAPES.length).map((p, i) =>
    h('figure', { class: `art art--${i + 1} art--${SHAPES[i]}`, style: { '--depth': [16, -12, 22, -18, 10][i] } },
      h('img', { src: photoUrl(p.src), alt: '', decoding: 'async', loading: i < 3 ? 'eager' : 'lazy' })));

  const ring = svg('<svg class="hero__ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" pathLength="1"/></svg>');
  const chalk = svg('<svg class="hero__chalk" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true"><path d="M5 26 C 90 4, 170 42, 270 20 S 450 4, 595 24" pathLength="1"/></svg>');

  const [line1, line2] = site.exhibit.title;
  const t1 = h('span', { class: 'hero__line' }, line1);
  const t2 = h('span', { class: 'hero__line hero__line--italic' }, line2);
  splitChars(t1);
  splitChars(t2);

  el.append(
    h('div', { class: 'hero__stage' }, ring, ...arts),
    h('div', { class: 'hero__copy' },
      h('p', { class: 'eyebrow hero__eyebrow' }, `${site.exhibit.kicker} · ${site.name}`),
      h('h1', { class: 'hero__title' }, t1, t2, chalk),
      h('p', { class: 'hero__note' }, site.exhibit.note),
      h('div', { class: 'hero__cta' },
        h('a', { class: 'btn btn--accent', href: '#doors' }, 'Bước vào phòng đầu tiên'),
        h('button', { class: 'btn btn--ghost', onClick: () => startReverie(photos) }, 'Lắng đọng ›'))),
    h('a', { class: 'hero__scroll', href: '#doors', 'aria-label': 'Cuộn xuống' }, h('span', null, 'Cuộn')));

  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${(nx * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(ny * 100).toFixed(1)}%`);
    el.style.setProperty('--px', ((nx - 0.5) * 2).toFixed(3));
    el.style.setProperty('--py', ((ny - 0.5) * 2).toFixed(3));
  });
}
