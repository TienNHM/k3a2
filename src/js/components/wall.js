// The "gallery wall": a handful of framed prints hung at uneven heights, each with a catalogue plate.
// Deliberately not a masonry grid — it should feel hung by a curator.

import { h, photoUrl } from '../core/dom.js';
import { catalogNo } from '../core/data.js';
import { gsap, canScrub } from '../core/motion.js';
import { openViewer } from './viewer.js';

const TILTS = [-1.4, 0.9, -0.6, 1.3, -1.0, 0.5];
const shapeOf = (ratio) => (ratio > 1.25 ? 'land' : ratio < 0.85 ? 'port' : 'sq');

/**
 * @param {import('../core/data.js').Photo[]} picks  the photos to hang
 * @param {import('../core/data.js').Photo[]} album  the full album (the viewer pages through all of it)
 */
export function wall(picks, album) {
  return h('div', { class: 'wall' },
    picks.map((p, i) => {
      const index = album.indexOf(p);
      const open = () => openViewer(album, index);
      return h('figure', {
        class: `frame frame--${shapeOf(p.ratio)} frame--v${i % 4}`,
        style: { '--ratio': p.ratio.toFixed(3), '--tilt': `${TILTS[i % TILTS.length]}deg` },
        dataset: { reveal: '' },
        'data-cursor': 'Xem', tabindex: '0', role: 'button', 'aria-label': `Xem ảnh ${index + 1} trong ${p.album}`,
        onClick: open,
        onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
      },
      h('div', { class: 'frame__mat' },
        h('img', { src: photoUrl(p.src), alt: p.album, loading: 'lazy', decoding: 'async' })),
      h('figcaption', { class: 'plate plate--sm' },
        h('span', { class: 'plate__no' }, catalogNo(index + 1)),
        h('span', { class: 'plate__title' }, p.album)));
    }));
}

/** Call after the walls are attached to the page: adds a gentle scroll parallax to alternate frames. */
export function enhanceWalls(root) {
  if (!canScrub) return;
  root.querySelectorAll('.wall .frame').forEach((frame, i) => {
    gsap.fromTo(frame, { y: i % 2 ? 36 : -24 }, {
      y: i % 2 ? -36 : 24, ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
