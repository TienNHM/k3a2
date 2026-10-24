// The sound button in the top bar: a small equaliser that moves while sound plays.

import { h } from '../core/dom.js';
import { enable, disable, isEnabled, onChange, preferred, resumeOnGesture } from '../core/audio.js';

export function createSoundToggle() {
  const button = h('button', { class: 'nav__sound', 'aria-pressed': 'false', onClick: () => (isEnabled() ? disable() : enable()) },
    h('span', { class: 'eq', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')));

  const sync = () => {
    const on = isEnabled();
    button.setAttribute('aria-pressed', String(on));
    button.classList.toggle('is-on', on);
    // "Pending": the visitor chose sound before, but the browser wants a click first.
    button.classList.toggle('is-pending', !on && preferred());
    const label = on ? 'Tắt âm thanh' : 'Bật âm thanh';
    button.setAttribute('aria-label', label);
    button.title = label;
  };

  onChange(sync);
  sync();
  resumeOnGesture();
  return button;
}
