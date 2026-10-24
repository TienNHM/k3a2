// Motion utilities. GSAP + ScrollTrigger are optional (loaded from a CDN by each page);
// everything degrades to plain CSS if they are missing or the user prefers reduced motion.

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const gsap = window.gsap ?? null;
export const ScrollTrigger = window.ScrollTrigger ?? null;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/** True when scroll-driven GSAP effects can run. */
export const canScrub = Boolean(gsap && ScrollTrigger) && !reduced;

/** Fade/slide in anything marked [data-reveal] when it scrolls into view. */
export function reveal(root = document) {
  const els = [...root.querySelectorAll('[data-reveal]:not(.in)')];
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
  );
  els.forEach((el) => io.observe(el));
}

/**
 * Wrap each character in <span class="ch" style="--i:n"> (grouped per word, so lines still wrap
 * between words) and let CSS stagger them. Screen readers get the full text from aria-label.
 */
export function splitChars(el) {
  const text = el.textContent.normalize('NFC');
  el.textContent = '';
  el.setAttribute('aria-label', text);
  let n = 0;
  text.split(' ').forEach((word, w, all) => {
    const group = document.createElement('span');
    group.className = 'word';
    group.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', n++);
      s.textContent = ch;
      group.append(s);
    }
    el.append(group);
    if (w < all.length - 1) { el.append(' '); n++; }
  });
}

/** Wrap each word in <span class="w">; returns the spans. */
export function splitWords(el) {
  const words = el.textContent.normalize('NFC').split(/\s+/).filter(Boolean);
  el.textContent = '';
  return words.map((word, i) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = word;
    el.append(s, i < words.length - 1 ? ' ' : '');
    return s;
  });
}

/** Drag-to-scroll for a horizontally scrollable element. */
export function dragScroll(el) {
  let down = false, startX = 0, startLeft = 0, moved = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return; // native touch scrolling is better
    down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
    el.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    el.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    el.classList.remove('is-dragging');
  });
  // A drag must not end in a click on the frame under the pointer.
  el.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}
