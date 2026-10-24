// "Gợi nhớ một khoảnh khắc": every click drops a random photo onto the table as a polaroid.

import { h, photoUrl } from '../core/dom.js';
import { photos, pick, albumOf, roomByName } from '../core/data.js';
import { dot } from '../core/format.js';
import { openViewer } from './viewer.js';

const MAX_STACK = 5;

export default function mount(el) {
  el.classList.add('moment', 'theme-paper');
  if (!photos.length) { el.hidden = true; return; }

  const table = h('div', { class: 'moment__table' });
  const button = h('button', { class: 'btn btn--accent', onClick: drop }, 'Gợi nhớ một khoảnh khắc');
  const link = h('a', { class: 'moment__link', href: '#', hidden: true });

  el.append(
    h('div', { class: 'moment__copy', 'data-reveal': '' },
      h('p', { class: 'eyebrow' }, 'Khoảnh khắc'),
      h('h2', { class: 'display' }, 'Một tấm ảnh, một câu chuyện'),
      h('p', { class: 'lede' }, 'Đôi khi không cần tìm. Cứ để một khoảnh khắc tự tìm đến bạn.'),
      button, link),
    table);

  let last = null;

  function drop() {
    const p = pick(photos.filter((x) => x !== last));
    last = p;
    const album = albumOf(p);
    const room = roomByName(p.room);
    const tilt = ((Math.random() - 0.5) * 14).toFixed(1);

    const card = h('figure', {
      class: 'polaroid', 'data-cursor': 'Xem', tabindex: '0',
      style: { '--tilt': `${tilt}deg`, '--dx': `${((Math.random() - 0.5) * 18).toFixed(1)}%` },
      onClick: () => openViewer(album ? album.photos : [p], album ? album.photos.indexOf(p) : 0),
    },
    h('img', { src: photoUrl(p.thumb), alt: p.album, decoding: 'async' }),
    h('figcaption', null, h('span', { class: 'polaroid__name' }, p.album), h('span', { class: 'polaroid__meta' }, dot(album?.dates, album?.place))));

    table.append(card);
    while (table.children.length > MAX_STACK) table.firstElementChild.remove();
    link.hidden = false;
    link.href = `${room.slug}.html#${album?.slug ?? ''}`;
    link.dataset.hue = room.hue;
    link.textContent = `Vào phòng “${room.name}” →`;
  }

  drop();
}
