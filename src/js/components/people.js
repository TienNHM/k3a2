// "Con người": one card per member, teacher first, then everyone by given name.
// A card turns over to show who they are today only when `now` is filled in (content/people.js).

import { h, photoUrl } from '../core/dom.js';
import { members } from '../../content/people.js';

const initial = (name) => name.trim().split(/\s+/).pop()?.[0] ?? '?';
const givenName = (m) => m.sort ?? m.name.trim().split(/\s+/).pop() ?? '';

const sorted = [...members].sort(
  (a, b) => Number(Boolean(b.teacher)) - Number(Boolean(a.teacher)) || givenName(a).localeCompare(givenName(b), 'vi') || a.name.localeCompare(b.name, 'vi'),
);

function avatar(m) {
  return h('div', { class: 'person__avatar' },
    m.avatar ? h('img', { src: photoUrl(m.avatar), alt: m.name, loading: 'lazy' }) : h('span', null, initial(m.name)));
}

function front(m) {
  return [
    avatar(m),
    h('h3', { class: 'person__name' }, m.name),
    m.role ? h('p', { class: 'person__role' }, m.role) : null,
    m.quote ? h('q', { class: 'person__quote' }, m.quote) : null,
  ];
}

function card(m, i) {
  const classes = ['person', m.teacher && 'person--teacher', !m.now && 'person--plain'].filter(Boolean).join(' ');
  const props = { class: classes, dataset: { reveal: '' }, style: { '--i': i % 6 } };

  if (!m.now) return h('article', props, h('div', { class: 'person__inner' }, h('div', { class: 'person__face person__front' }, front(m))));

  return h('article', { ...props, tabindex: '0', 'data-cursor': 'Lật' },
    h('div', { class: 'person__inner' },
      h('div', { class: 'person__face person__front' }, front(m)),
      h('div', { class: 'person__face person__back' },
        h('p', { class: 'eyebrow' }, 'Bây giờ'),
        h('p', { class: 'person__now' }, m.now))));
}

export default function mount(el) {
  el.classList.add('people');
  el.append(
    h('p', { class: 'people__count', dataset: { reveal: '' } }, `${members.length} người trong ảnh`),
    h('div', { class: 'people__grid' }, sorted.map(card)));
}
