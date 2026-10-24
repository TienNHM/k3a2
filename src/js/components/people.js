// "Con người": one card per member. The card turns over to show who they are today.

import { h, photoUrl } from '../core/dom.js';
import { members } from '../../content/people.js';

const initial = (name) => name.trim().split(/\s+/).pop()?.[0] ?? '?';

export default function mount(el) {
  el.classList.add('people');

  const card = (m, i) =>
    h('article', { class: 'person', tabindex: '0', dataset: { reveal: '' }, style: { '--i': i }, 'data-cursor': 'Lật' },
      h('div', { class: 'person__inner' },
        h('div', { class: 'person__face person__front' },
          h('div', { class: 'person__avatar' },
            m.avatar ? h('img', { src: photoUrl(m.avatar), alt: m.name, loading: 'lazy' }) : h('span', null, initial(m.name))),
          h('h3', { class: 'person__name' }, m.name),
          h('p', { class: 'person__role' }, m.role ?? ''),
          m.quote ? h('q', { class: 'person__quote' }, m.quote) : null),
        h('div', { class: 'person__face person__back' },
          h('p', { class: 'eyebrow' }, 'Bây giờ'),
          h('p', { class: 'person__now' }, m.now ?? '—'))));

  el.append(h('div', { class: 'people__grid' }, members.map(card)));
}
