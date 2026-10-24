// "Địa điểm": a list of places beside a map that follows your choice.

import { h } from '../core/dom.js';
import { places } from '../../content/places.js';

const embed = (query) => `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

export default function mount(el) {
  el.classList.add('places');
  if (!places.length) { el.hidden = true; return; }

  const frame = h('iframe', { class: 'places__map', title: 'Bản đồ', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', src: embed(places[0].query) });
  const link = h('a', { class: 'places__open', target: '_blank', rel: 'noopener' }, 'Mở trong Google Maps ↗');

  const buttons = places.map((p, i) => h('li', null,
    h('button', { class: `place${i === 0 ? ' is-active' : ''}`, onClick: () => select(i) },
      h('span', { class: 'place__no' }, String(i + 1).padStart(2, '0')),
      h('span', { class: 'place__name' }, p.name),
      h('span', { class: 'place__note' }, p.note ?? ''))));

  function select(i) {
    const p = places[i];
    frame.src = embed(p.query);
    link.href = p.link ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`;
    el.querySelectorAll('.place').forEach((b, n) => b.classList.toggle('is-active', n === i));
  }

  el.append(
    h('ol', { class: 'places__list' }, buttons),
    h('div', { class: 'places__stage' }, frame, link));
  select(0);
}
