// The data model. Combines the generated photo manifest with hand-written content
// into rooms → albums → photos. Pure data, no DOM — safe to import anywhere.

import { roomMeta } from '../../content/rooms.js';
import { albumMeta } from '../../content/albums.js';
import manifest from '../../content/photos.manifest.js';

/** @typedef {{id:number, src:string, thumb:string, room:string, album:string, w:number, h:number, ratio:number}} Photo */
/** @typedef {{name:string, slug:string, photos:Photo[], year?:number, dates?:string, place?:string, story?:string}} Album */
/** @typedef {{name:string, slug:string, hue:number, kicker:string, mood:string, desc:string, albums:Album[], photos:Photo[], cover:Photo|null}} Room */

export const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** @type {Photo[]} */
export const photos = manifest.map((p, i) => ({
  ...p,
  id: i,
  thumb: p.thumb ?? p.src,
  ratio: p.w && p.h ? p.w / p.h : 1.5,
}));

/** Evenly spaced picks — gives a representative spread of a list. */
export function featured(list, n) {
  if (list.length <= n) return [...list];
  return Array.from({ length: n }, (_, k) => list[Math.floor(((k + 0.5) * list.length) / n)]);
}

/** A good cover: a landscape-ish photo from the middle of the list. */
function pickCover(list) {
  if (!list.length) return null;
  const mid = Math.floor(list.length / 2);
  for (let d = 0; d < list.length; d++) {
    for (const i of [mid + d, mid - d]) {
      const p = list[i];
      if (p && p.ratio >= 1.2 && p.ratio <= 1.9) return p;
    }
  }
  return list[mid];
}

const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name, 'vi');

/** @returns {Room[]} */
function buildRooms() {
  const names = [...new Set(photos.map((p) => p.room))];
  return names
    .map((name) => {
      const meta = roomMeta[name] ?? {};
      const roomPhotos = photos.filter((p) => p.room === name);
      const albums = [...new Set(roomPhotos.map((p) => p.album))]
        .map((albumName) => ({
          name: albumName,
          slug: slugify(albumName),
          ...albumMeta[albumName],
          photos: roomPhotos.filter((p) => p.album === albumName),
        }))
        .sort(byOrder);
      return {
        name,
        slug: slugify(name),
        order: meta.order,
        hue: meta.hue ?? 14,
        kicker: meta.kicker ?? '',
        mood: meta.mood ?? '',
        sound: meta.sound, // ambient palette: 'wistful' | 'bright' | 'tender' | 'warm' (see core/audio.js)
        desc: meta.desc ?? '',
        albums,
        photos: roomPhotos,
        // content/rooms.js may name a specific cover (a photo's `src`); otherwise one is chosen automatically.
        cover: roomPhotos.find((p) => p.src === meta.cover) ?? pickCover(roomPhotos),
      };
    })
    .sort(byOrder);
}

export const rooms = buildRooms();
export const roomBySlug = (slug) => rooms.find((r) => r.slug === slug);
export const roomByName = (name) => rooms.find((r) => r.name === name);
export const albumOf = (photo) => roomByName(photo.room)?.albums.find((a) => a.name === photo.album);

/** Photos whose album is tagged with `year` in content/albums.js. */
export function photosOfYear(year) {
  return rooms.flatMap((r) => r.albums.filter((a) => a.year === year).flatMap((a) => a.photos));
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "Nº 007" style catalogue number. */
export const catalogNo = (n, pad = 3) => `Nº ${String(n).padStart(pad, '0')}`;
