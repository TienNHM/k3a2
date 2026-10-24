// Hero for the secondary pages. Configure it from the element:
//   <header data-component="page-header" data-kicker="…" data-title="…" data-text="…"></header>

import { h, svg } from '../core/dom.js';
import { splitChars } from '../core/motion.js';

export default function mount(el) {
  el.classList.add('phead');
  el.id = 'top';
  const title = h('h1', { class: 'phead__title' }, el.dataset.title ?? '');
  splitChars(title);
  el.append(
    h('div', { class: 'phead__art', 'aria-hidden': 'true' }, h('span', { class: 'phead__arch' }), h('span', { class: 'phead__dot' })),
    h('div', { class: 'phead__copy' },
      h('p', { class: 'eyebrow' }, el.dataset.kicker ?? ''),
      title,
      svg('<svg class="phead__chalk" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true"><path d="M5 26 C 90 4, 170 42, 270 20 S 450 4, 595 24" pathLength="1"/></svg>'),
      el.dataset.text ? h('p', { class: 'lede' }, el.dataset.text) : null));
}
