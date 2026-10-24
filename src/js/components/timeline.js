// The story in time. On wide screens the section pins and scrolls sideways as you scroll down;
// on narrow screens (or reduced motion) it is a native horizontal scroller. Photos fade from sepia to colour.

import { h, photoUrl } from '../core/dom.js';
import { timeline } from '../../content/timeline.js';
import { rooms, roomByName, photosOfYear, featured } from '../core/data.js';
import { gsap, canScrub } from '../core/motion.js';
import { dot } from '../core/format.js';

/** Albums tagged with this year, as links to their place on a room page. */
const albumsOf = (year) =>
  rooms.flatMap((r) => r.albums.filter((a) => a.year === year).map((a) => ({ room: r, album: a }))).slice(0, 4);

function photoFor(era) {
  if (era.year === 'Nay') return roomByName('Họp lớp và sau này')?.cover ?? null;
  const list = photosOfYear(era.year);
  return list.length ? featured(list, 1)[0] : null;
}

function item(era, i, total) {
  const photo = photoFor(era);
  const tone = total > 1 ? 1 - i / (total - 1) : 0; // 1 = oldest (sepia) … 0 = now (colour)
  return h('article', { class: 'tl__item', style: { '--tone': tone.toFixed(2) } },
    h('div', { class: 'tl__year', 'aria-hidden': 'true' }, String(era.year)),
    h('figure', { class: 'tl__photo' },
      photo
        ? h('img', { src: photoUrl(photo.src), alt: era.title, loading: 'lazy', decoding: 'async' })
        : h('div', { class: 'tl__empty' }, era.emptyNote ?? '…')),
    h('div', { class: 'tl__body' },
      h('p', { class: 'eyebrow' }, dot(String(era.year), era.label)),
      h('h3', { class: 'tl__title' }, era.title),
      h('p', null, era.text),
      h('ul', { class: 'tl__albums' },
        albumsOf(era.year).map(({ room, album }) =>
          h('li', null, h('a', { href: `${room.slug}.html#${album.slug}`, dataset: { hue: room.hue } }, album.name))))));
}

export default function mount(el) {
  el.classList.add('tl');
  el.id = 'timeline';

  const track = h('div', { class: 'tl__track' },
    h('div', { class: 'tl__intro' },
      h('p', { class: 'eyebrow' }, 'Thời gian'),
      h('h2', { class: 'display' }, 'Đi qua từng mùa'),
      h('p', { class: 'lede' }, 'Cuộn để đi từ ngày đầu tiên đến hôm nay. Ảnh càng cũ càng ngả màu.')),
    timeline.map((era, i) => item(era, i, timeline.length)));
  const fill = h('span', { class: 'tl__progress-fill' });
  el.append(track, h('div', { class: 'tl__progress', 'aria-hidden': 'true' }, fill));

  if (!canScrub) return;
  gsap.matchMedia().add('(min-width: 900px)', () => {
    el.classList.add('is-pinned');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: el, start: 'top top', end: () => `+=${distance()}`,
        pin: true, scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: (self) => { fill.style.transform = `scaleX(${self.progress.toFixed(3)})`; },
      },
    });
    return () => el.classList.remove('is-pinned');
  });
}
