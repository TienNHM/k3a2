// Top bar + full-screen "Lối đi" menu (the exhibition guide). Rooms are listed automatically.

import { h } from '../core/dom.js';
import { site } from '../../content/site.js';
import { rooms } from '../core/data.js';

const pad = (n) => String(n).padStart(2, '0');

function menuItems() {
  return [
    { href: 'index.html', label: 'Sảnh triển lãm', key: 'home', kicker: 'Bắt đầu từ đây', no: '00' },
    ...rooms.map((r, i) => ({ href: `${r.slug}.html`, label: r.name, key: r.slug, kicker: r.kicker, hue: r.hue, no: pad(i + 1) })),
    ...site.nav.map((n, i) => ({ ...n, no: pad(rooms.length + i + 1) })),
  ];
}

export function mountNav(activeKey) {
  const items = menuItems();

  const menu = h('nav', { class: 'menu', id: 'menu', 'aria-label': 'Lối đi' },
    h('p', { class: 'menu__eyebrow eyebrow' }, 'Lối đi · Hướng dẫn tham quan'),
    h('ol', { class: 'menu__list' },
      items.map((it, i) => h('li', { style: { '--i': i } },
        h('a', {
          href: it.href, class: `menu__link${it.key === activeKey ? ' is-active' : ''}`,
          dataset: it.hue != null ? { hue: it.hue } : {},
          style: it.hue != null ? { '--hue': it.hue } : {},
        },
        h('span', { class: 'menu__no' }, it.no),
        h('span', { class: 'menu__label' }, it.label),
        h('span', { class: 'menu__kicker' }, it.kicker ?? ''))))));

  const toggle = h('button', { class: 'nav__toggle', 'aria-expanded': 'false', 'aria-controls': 'menu' },
    h('span', { class: 'nav__toggle-label' }, 'Lối đi'),
    h('span', { class: 'nav__bars', 'aria-hidden': 'true' }));

  const bar = h('header', { class: 'nav' },
    h('a', { class: 'nav__brand', href: 'index.html', 'aria-label': `${site.name} — về sảnh` },
      h('span', { class: 'nav__brand-name' }, site.name),
      h('span', { class: 'nav__brand-sub' }, site.exhibit.kicker)),
    toggle);

  document.body.prepend(bar, menu);

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('is-locked', open);
    toggle.querySelector('.nav__toggle-label').textContent = open ? 'Đóng' : 'Lối đi';
  };
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });

  // The bar tucks away while reading and returns when scrolling up.
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    bar.classList.toggle('is-hidden', y > lastY && y > 240);
    bar.classList.toggle('is-solid', y > 40);
    lastY = y;
  }, { passive: true });
}
