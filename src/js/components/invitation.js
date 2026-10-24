// The lobby's closing call to action: sit down and let the photos play.

import { h } from '../core/dom.js';
import { photos } from '../core/data.js';
import { startReverie } from './reverie.js';

export default function mount(el) {
  el.classList.add('invite');
  el.append(
    h('div', { class: 'invite__inner', 'data-reveal': '' },
      h('p', { class: 'eyebrow' }, 'Lắng đọng'),
      h('h2', { class: 'invite__title' }, 'Ngồi lại một lát nhé?'),
      h('p', { class: 'lede' }, 'Tắt bớt tiếng ồn. Để từng bức ảnh trôi qua thật chậm, như một buổi chiều cuối năm học.'),
      h('div', { class: 'invite__cta' },
        h('button', { class: 'btn btn--accent', disabled: !photos.length, onClick: () => startReverie(photos) }, 'Bắt đầu lắng đọng'),
        h('a', { class: 'btn btn--ghost', href: 'lang-dong.html' }, 'Đọc những lời nhắn'))));
}
