// YouTube videos, loaded only when clicked (no third-party requests until then).
// As a component it renders every video in content/videos.js; other components can use videoGrid(list).

import { h } from '../core/dom.js';
import { videos } from '../../content/videos.js';

export function videoGrid(list) {
  const grid = h('div', { class: 'videos' },
    list.map((v) => h('button', { class: 'video', 'aria-label': `Phát: ${v.title}`, 'data-cursor': 'Phát', dataset: { id: v.id } },
      h('img', { src: `https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg`, alt: '', loading: 'lazy' }),
      h('span', { class: 'video__play', 'aria-hidden': 'true' }, '▶'),
      h('span', { class: 'video__title' }, v.title))));

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.video');
    if (!btn) return;
    btn.replaceWith(h('div', { class: 'video' }, h('iframe', {
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.id)}?autoplay=1`,
      title: 'Video', allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true,
    })));
  });
  return grid;
}

export default function mount(el) {
  if (!videos.length) { el.hidden = true; return; }
  el.append(
    h('div', { class: 'section__head', dataset: { reveal: '' } },
      h('p', { class: 'eyebrow' }, 'Chuyển động'),
      h('h2', { class: 'display' }, 'Video kỷ niệm')),
    videoGrid(videos));
}
