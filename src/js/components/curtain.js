// Page transition: an iris that closes over the clicked point, then opens on the next page.

import { h } from '../core/dom.js';
import { reduced } from '../core/motion.js';

const KEY = 'k3a2:curtain-hue';
const CLOSE_MS = 650;

const read = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { v == null ? sessionStorage.removeItem(KEY) : sessionStorage.setItem(KEY, v); } catch { /* private mode */ } };

export function mountCurtain() {
  const el = h('div', { class: 'curtain', 'aria-hidden': 'true' });
  document.body.append(el);
  if (reduced) return;

  // Arriving: start fully closed (in the colour of the door we came through), then open from the centre.
  const hue = read();
  if (hue != null) el.style.setProperty('--curtain', `hsl(${hue} 100% 62%)`);
  write(null);
  el.style.transition = 'none';
  el.classList.add('is-covering');
  void el.offsetWidth;
  el.style.transition = '';
  // A timer, not requestAnimationFrame: rAF is paused in tabs that are not being painted, which would leave the iris shut.
  setTimeout(() => el.classList.remove('is-covering'), 60);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchor

    e.preventDefault();
    el.style.setProperty('--cx', `${e.clientX}px`);
    el.style.setProperty('--cy', `${e.clientY}px`);
    if (a.dataset.hue) el.style.setProperty('--curtain', `hsl(${a.dataset.hue} 100% 62%)`);
    write(a.dataset.hue ?? null);
    el.classList.add('is-covering');
    setTimeout(() => { location.href = a.href; }, CLOSE_MS);
  });

  // Back/forward cache restores the page as it was when we left: open the iris again.
  window.addEventListener('pageshow', (e) => { if (e.persisted) el.classList.remove('is-covering'); });
}
