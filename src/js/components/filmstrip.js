// Contact-sheet rolls: the whole album as 35 mm strips you can drag sideways.

import { h, photoUrl } from '../core/dom.js';
import { dragScroll } from '../core/motion.js';
import { pad } from '../core/format.js';
import { openViewer } from './viewer.js';

const FRAMES_PER_ROLL = 36;

function roll(chunk, n, total, album) {
  const track = h('div', { class: 'roll__track', tabindex: '-1' },
    chunk.map((p) => {
      const index = album.indexOf(p);
      return h('button', {
        class: 'roll__frame', 'data-cursor': 'Xem', 'aria-label': `Xem ảnh ${index + 1} trong ${p.album}`,
        onClick: () => openViewer(album, index),
      },
      h('img', { src: photoUrl(p.thumb), alt: '', loading: 'lazy', decoding: 'async', width: p.w || null, height: p.h || null }),
      h('span', { class: 'roll__no' }, pad(index + 1, 3)));
    }));
  dragScroll(track);

  const slide = (dir) => track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });

  return h('div', { class: 'roll', dataset: { reveal: '' } },
    h('div', { class: 'roll__head' },
      h('span', { class: 'eyebrow' }, `Cuộn ${pad(n + 1)} / ${pad(total)}`),
      h('span', { class: 'roll__count' }, `${chunk.length} khung hình`),
      h('span', { class: 'roll__ctrl' },
        h('button', { class: 'roll__btn', 'aria-label': 'Cuộn trước', onClick: () => slide(-1) }, '‹'),
        h('button', { class: 'roll__btn', 'aria-label': 'Cuộn sau', onClick: () => slide(1) }, '›'))),
    track);
}

/** Splits `album` into rolls of ~36 frames so a 300-photo album is not one endless strip. */
export function rolls(album, size = FRAMES_PER_ROLL) {
  const chunks = [];
  for (let i = 0; i < album.length; i += size) chunks.push(album.slice(i, i + size));
  return h('div', { class: 'rolls' }, chunks.map((c, i) => roll(c, i, chunks.length, album)));
}
