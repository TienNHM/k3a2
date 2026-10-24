// Closing signature shown on every page.

import { h } from '../core/dom.js';
import { site } from '../../content/site.js';
import { photos } from '../core/data.js';

export function mountFooter() {
  const [from, to] = site.years;
  document.body.append(
    h('footer', { class: 'footer theme-paper' },
      h('p', { class: 'footer__big', 'aria-hidden': 'true' }, 'Hẹn gặp lại'),
      h('div', { class: 'footer__row' },
        h('p', null, `${site.name} · ${site.school}, ${site.province} · ${from}–${to}`,
          h('br'), `${photos.length} khoảnh khắc được giữ lại.`),
        h('a', { class: 'btn btn--ink', href: site.contact.url, target: '_blank', rel: 'noopener' }, site.contact.label),
        h('a', { class: 'footer__top', href: '#top', 'data-cursor': 'Lên' }, 'Về đầu trang ↑'))));
}
