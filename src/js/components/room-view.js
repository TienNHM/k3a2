// A whole room, built from data: hero → statement → one "collection" per album → next room.
// The page only needs <main data-component="room-view" data-room="Room name">.

import { h, photoUrl } from '../core/dom.js';
import { site } from '../../content/site.js';
import { videos } from '../../content/videos.js';
import { rooms, roomByName, featured } from '../core/data.js';
import { splitChars, splitWords, gsap, canScrub } from '../core/motion.js';
import { roman, pad, dot } from '../core/format.js';
import { startReverie } from './reverie.js';
import { wall, enhanceWalls } from './wall.js';
import { rolls } from './filmstrip.js';
import { videoGrid } from './videos.js';

const HIGHLIGHTS = 8; // frames on each album's gallery wall

function hero(room) {
  const title = h('h1', { class: 'rhero__title' }, room.name);
  splitChars(title);
  const n = rooms.indexOf(room) + 1;
  return h('section', { class: 'rhero', id: 'top' },
    h('figure', { class: 'rhero__arch' },
      room.cover ? h('img', { src: photoUrl(room.cover.src), alt: '', decoding: 'async' }) : null,
      h('span', { class: 'rhero__glow' })),
    h('div', { class: 'rhero__copy' },
      h('p', { class: 'eyebrow' }, dot(`Phòng ${pad(n)}`, room.kicker)),
      title,
      h('p', { class: 'rhero__mood' }, room.mood),
      h('ul', { class: 'rhero__stats' },
        h('li', null, h('b', null, room.photos.length), ' ảnh'),
        h('li', null, h('b', null, room.albums.length), ' bộ sưu tập')),
      h('nav', { class: 'rhero__jump', 'aria-label': 'Các bộ sưu tập' },
        room.albums.map((a) => h('a', { href: `#${a.slug}` }, a.name))),
      h('button', { class: 'btn btn--accent', onClick: () => startReverie(room.photos) }, 'Lắng đọng trong phòng này ›')));
}

function statement(room) {
  if (!room.desc) return null;
  const text = h('p', { class: 'statement__text' }, room.desc);
  const words = splitWords(text);
  if (canScrub) {
    gsap.fromTo(words, { opacity: 0.15 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 45%', scrub: true },
    });
  }
  return h('section', { class: 'statement' }, text);
}

function collection(album, i) {
  const picks = featured(album.photos, HIGHLIGHTS);
  return h('section', { class: 'coll', id: album.slug },
    h('header', { class: 'coll__head', dataset: { reveal: '' } },
      h('span', { class: 'coll__no', 'aria-hidden': 'true' }, roman(i + 1)),
      h('div', null,
        h('p', { class: 'eyebrow' }, `Bộ sưu tập ${roman(i + 1)}`),
        h('h2', { class: 'coll__title' }, album.name),
        h('ul', { class: 'coll__meta' },
          [album.dates, album.place, `${album.photos.length} ảnh`].filter(Boolean).map((t) => h('li', null, t))),
        album.story ? h('p', { class: 'coll__story' }, album.story) : null)),
    wall(picks, album.photos),
    album.photos.length > picks.length
      ? h('div', { class: 'coll__film' },
        h('p', { class: 'coll__film-title', dataset: { reveal: '' } }, 'Toàn bộ cuộn phim'),
        rolls(album.photos))
      : null);
}

function nextRoom(room) {
  if (rooms.length < 2) return null;
  const next = rooms[(rooms.indexOf(room) + 1) % rooms.length];
  return h('a', { class: 'rnext', href: `${next.slug}.html`, dataset: { hue: next.hue, reveal: '' }, style: { '--next-hue': next.hue }, 'data-cursor': 'Đi tiếp' },
    h('span', { class: 'eyebrow' }, 'Phòng tiếp theo'),
    h('span', { class: 'rnext__name' }, next.name, h('i', null, ' →')),
    h('span', { class: 'rnext__mood' }, dot(next.kicker, next.mood)));
}

export default function mount(el) {
  const room = roomByName(el.dataset.room);
  if (!room) {
    el.append(h('section', { class: 'section container' }, h('h1', { class: 'display' }, 'Phòng này chưa có ảnh'),
      h('a', { class: 'btn btn--ghost', href: 'index.html' }, '← Về sảnh')));
    return;
  }

  document.documentElement.style.setProperty('--hue', room.hue);
  document.title = `${room.name} — ${site.name}`;

  const roomVideos = videos.filter((v) => v.room === room.name);
  el.append(
    hero(room),
    statement(room),
    ...room.albums.map(collection),
    roomVideos.length ? h('section', { class: 'coll' }, h('h2', { class: 'coll__title' }, 'Video'), videoGrid(roomVideos)) : null,
    nextRoom(room));

  enhanceWalls(el);
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}
