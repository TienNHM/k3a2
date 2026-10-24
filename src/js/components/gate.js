// The entrance: two arched doors that open on first visit of a session.
// The visitor also chooses here whether to hear the exhibition (a click is the gesture browsers need for audio).

import { h } from '../core/dom.js';
import { site } from '../../content/site.js';
import { rooms } from '../core/data.js';
import { reduced } from '../core/motion.js';
import { enable, disable, sfx } from '../core/audio.js';

const KEY = 'k3a2:entered';
const enter = () => document.documentElement.classList.add('is-entered');
const seen = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
const remember = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ } };

export function mountGate() {
  if (seen() || reduced) return enter();

  const bar = h('span', { class: 'gate__bar-fill' });
  const withSound = h('button', { class: 'btn btn--accent gate__button', disabled: true }, 'Đang chuẩn bị…');
  const quiet = h('button', { class: 'btn btn--ghost', disabled: true }, 'Vào, không âm thanh');
  const gate = h('div', { class: 'gate', role: 'dialog', 'aria-label': 'Lối vào triển lãm' },
    h('div', { class: 'gate__door gate__door--l' }),
    h('div', { class: 'gate__door gate__door--r' }),
    h('div', { class: 'gate__center' },
      h('p', { class: 'eyebrow' }, site.exhibit.kicker),
      h('h1', { class: 'gate__title' }, site.name),
      h('p', { class: 'gate__note' }, site.exhibit.note),
      h('div', { class: 'gate__bar' }, bar),
      h('div', { class: 'gate__actions' }, withSound, quiet),
      h('p', { class: 'gate__hint' }, 'Triển lãm có âm thanh nhẹ. Bạn có thể tắt bất cứ lúc nào ở góc trên bên phải.')));
  document.body.append(gate);
  document.documentElement.classList.add('is-locked');

  // Warm the cache with each room's cover so the lobby appears instantly.
  const covers = rooms.map((r) => r.cover?.src).filter(Boolean);
  let done = 0;
  const ready = () => {
    withSound.disabled = false;
    quiet.disabled = false;
    withSound.textContent = 'Bước vào, có âm thanh';
  };
  const tick = () => {
    done += 1;
    bar.style.transform = `scaleX(${covers.length ? done / covers.length : 1})`;
    if (done >= covers.length) ready();
  };
  covers.forEach((src) => { const im = new Image(); im.onload = im.onerror = tick; im.src = encodeURI(src); });
  if (!covers.length) ready();
  setTimeout(ready, 3000); // never trap the visitor behind a slow image

  async function open(sound) {
    remember();
    if (sound) { await enable(); sfx('door'); } else disable();
    gate.classList.add('is-open');
    setTimeout(enter, 700);
    setTimeout(() => { gate.remove(); document.documentElement.classList.remove('is-locked'); }, 1700);
  }
  withSound.addEventListener('click', () => open(true));
  quiet.addEventListener('click', () => open(false));
  withSound.focus();
}
