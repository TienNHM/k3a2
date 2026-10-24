// Time machine: drag from "Nay" back to the first year. The photo changes with the era and ages
// (sepia, grain, soft focus) in proportion to how far back you are.

import { h, photoUrl } from '../core/dom.js';
import { timeline } from '../../content/timeline.js';
import { present } from '../../content/people.js';
import { roomByName, photosOfYear, pick, photos } from '../core/data.js';
import { dot } from '../core/format.js';
import { sfx } from '../core/audio.js';

function photosForEra(era) {
  if (era.year === 'Nay') {
    const room = roomByName('Họp lớp và sau này');
    return room ? room.photos : photos.slice(-12);
  }
  return photosOfYear(era.year);
}

export default function mount(el) {
  el.classList.add('tm');
  const last = timeline.length - 1;

  const img = h('img', { class: 'tm__img', alt: '' });
  const empty = h('div', { class: 'tm__empty', hidden: true });
  const yearEl = h('div', { class: 'tm__year', 'aria-hidden': 'true' });
  const label = h('p', { class: 'eyebrow' });
  const title = h('h3', { class: 'tm__title' });
  const text = h('p', null);
  const range = h('input', { class: 'tm__range', type: 'range', min: 0, max: last, step: 0.01, value: last, 'aria-label': 'Kéo để đi qua các năm' });
  const ticks = h('ol', { class: 'tm__ticks' },
    timeline.map((era, i) => h('li', { style: { '--at': last ? i / last : 0 } },
      h('button', { onClick: () => { range.value = i; update(); } }, String(era.year)))));

  el.append(
    h('div', { class: 'tm__head', 'data-reveal': '' },
      h('p', { class: 'eyebrow' }, 'Quá khứ ↔ Hiện tại'),
      h('h2', { class: 'display' }, 'Cỗ máy thời gian'),
      h('p', { class: 'lede' }, 'Kéo thanh trượt về phía trái để quay lại những ngày cũ.')),
    h('div', { class: 'tm__stage' },
      h('figure', { class: 'tm__frame' }, img, empty, h('span', { class: 'tm__grain' }), h('span', { class: 'tm__veil' })),
      yearEl,
      h('div', { class: 'tm__card' }, label, title, text)),
    h('div', { class: 'tm__control' }, range, ticks));

  let era = -1;
  function setEra(i) {
    const e = timeline[i];
    const pool = photosForEra(e);
    const isNow = e.year === 'Nay';
    yearEl.textContent = String(e.year);
    label.textContent = dot(String(e.year), e.label);
    title.textContent = isNow ? present.title : e.title;
    text.textContent = isNow ? present.text : e.text;
    img.classList.remove('is-in', 'is-ghost');
    if (pool.length) {
      const p = pick(pool);
      empty.hidden = true;
      img.hidden = false;
      img.src = photoUrl(p.src);
      img.alt = p.album;
      void img.offsetWidth;
      img.classList.add('is-in');
    } else {
      // No photo for this year: show the note over a dim, blurred ghost of the next year that has one.
      const later = timeline.slice(i + 1).map(photosForEra).find((list) => list.length);
      empty.hidden = false;
      empty.textContent = e.emptyNote ?? 'Chưa có ảnh của năm này.';
      if (later) {
        img.hidden = false;
        img.src = photoUrl(pick(later).src);
        img.alt = '';
        void img.offsetWidth;
        img.classList.add('is-in', 'is-ghost');
      } else {
        img.hidden = true;
      }
    }
  }

  function update() {
    const v = Number(range.value);
    el.style.setProperty('--past', (last ? 1 - v / last : 0).toFixed(3));
    const nearest = Math.round(v);
    if (nearest !== era) { if (era !== -1) sfx('tick', { gain: 0.05 }); era = nearest; setEra(era); }
  }

  range.addEventListener('input', update);
  update();
}
