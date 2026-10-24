// "Lưu bút": one wish at a time, large and quiet, with every note laid out below as paper slips.

import { h } from '../core/dom.js';
import { wishes } from '../../content/people.js';
import { reduced } from '../core/motion.js';

const ROTATE_MS = 7000;

export default function mount(el) {
  el.classList.add('wishes');
  if (!wishes.length) { el.hidden = true; return; }

  const quote = h('blockquote', { class: 'wishes__quote' });
  const from = h('p', { class: 'wishes__from' });
  let i = -1;
  let timer;

  const show = (n) => {
    i = (n + wishes.length) % wishes.length;
    quote.classList.remove('is-in');
    void quote.offsetWidth;
    quote.textContent = wishes[i].text;
    from.textContent = `— ${wishes[i].from}`;
    quote.classList.add('is-in');
  };
  const play = () => { if (!reduced && wishes.length > 1) timer = setInterval(() => show(i + 1), ROTATE_MS); };
  const stage = h('div', { class: 'wishes__stage', 'data-reveal': '' }, quote, from);
  stage.addEventListener('pointerenter', () => clearInterval(timer));
  stage.addEventListener('pointerleave', play);

  el.append(
    stage,
    h('ul', { class: 'wishes__slips' },
      wishes.map((w, n) => h('li', { class: 'slip', dataset: { reveal: '' }, style: { '--r': `${n % 2 ? 1.6 : -1.8}deg` } },
        h('p', null, w.text), h('span', null, `— ${w.from}`)))));
  show(0);
  play();
}
