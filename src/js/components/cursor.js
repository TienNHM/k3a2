// A soft ring that trails the pointer (desktop only). Elements can set data-cursor="Xem" to show a label.

import { h } from '../core/dom.js';
import { reduced } from '../core/motion.js';

export function mountCursor() {
  if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const label = h('span', { class: 'cursor__label' });
  const ring = h('div', { class: 'cursor', 'aria-hidden': 'true' }, label);
  document.body.append(ring);

  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    ring.classList.add('is-on');
  }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('is-on'));

  document.addEventListener('pointerover', (e) => {
    const withLabel = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button, input, [data-cursor]');
    ring.classList.toggle('is-link', Boolean(interactive));
    ring.classList.toggle('has-label', Boolean(withLabel));
    label.textContent = withLabel?.dataset.cursor ?? '';
  });

  (function loop() {
    x += (tx - x) * 0.2;
    y += (ty - y) * 0.2;
    ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  })();
}
