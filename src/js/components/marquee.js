// A band of big words that drifts across the page. Words come from content/site.js.

import { h } from '../core/dom.js';
import { site } from '../../content/site.js';

export default function mount(el) {
  el.classList.add('marquee');
  el.setAttribute('aria-hidden', 'true');
  // Two identical rows; the track slides by exactly one row, so the loop is seamless.
  const row = () => h('div', { class: 'marquee__row' },
    [...site.marquee, ...site.marquee].map((word) => h('span', { class: 'marquee__item' }, word, h('i', { class: 'marquee__star' }, '✦'))));
  el.append(h('div', { class: 'marquee__track' }, row(), row()));
}
