// The rooms of the exhibition, drawn as arched doors. Rooms come from the photo folders automatically.

import { h, photoUrl } from '../core/dom.js';
import { rooms } from '../core/data.js';
import { pad, dot } from '../core/format.js';

export default function mount(el) {
  el.classList.add('doors');
  el.id = 'doors';

  const door = (room, i) =>
    h('a', {
      class: 'door', href: `${room.slug}.html`, 'data-cursor': 'Bước vào',
      dataset: { hue: room.hue, reveal: '' },
      style: { '--hue': room.hue, '--i': i },
    },
    h('figure', { class: 'door__arch' },
      room.cover ? h('img', { src: photoUrl(room.cover.src), alt: '', loading: 'lazy', decoding: 'async' }) : null,
      h('span', { class: 'door__glow' })),
    h('div', { class: 'door__label' },
      h('span', { class: 'door__no' }, `Phòng ${pad(i + 1)}`),
      h('h3', { class: 'door__name' }, room.name),
      h('p', { class: 'door__kicker' }, dot(room.kicker, room.mood)),
      h('p', { class: 'door__desc' }, room.desc),
      h('p', { class: 'door__count' }, `${room.photos.length} ảnh · ${room.albums.length} bộ sưu tập`)));

  el.append(
    h('div', { class: 'doors__head', 'data-reveal': '' },
      h('p', { class: 'eyebrow' }, 'Phòng trưng bày'),
      h('h2', { class: 'display' }, `${rooms.length} căn phòng, một câu chuyện`),
      h('p', { class: 'lede' }, 'Mỗi cánh cửa mở ra một khoảng ký ức. Chọn một cánh cửa theo tâm trạng của bạn.')),
    rooms.length
      ? h('div', { class: 'doors__row' }, rooms.map(door))
      : h('p', { class: 'lede' }, 'Chưa có ảnh — thêm ảnh vào photos/ rồi chạy tools/gen-photos.ps1.'));
}
