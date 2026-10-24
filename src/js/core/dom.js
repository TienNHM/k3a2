// Tiny DOM helpers. `h()` builds elements without innerHTML, so text is always escaped.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/**
 * Hyperscript: h('a', { class: 'btn', href: '#', onClick: fn, style: { '--x': 1 } }, 'text', child)
 * - `class`, `dataset`, `style` (object of CSS props/vars) and `onXxx` handlers are special.
 * - `true` renders a boolean attribute; `null`/`false` skip the attribute.
 * - Children may be strings, nodes, nested arrays, or null/false (ignored).
 * @returns {HTMLElement}
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'style' && typeof value === 'object') {
      for (const [prop, val] of Object.entries(value)) el.style.setProperty(prop, val);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...children.flat(Infinity).filter((c) => c != null && c !== false));
  return el;
}

/** Static, trusted markup only (decorative SVG). Never pass user/content text here. */
export function svg(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const photoUrl = (path) => encodeURI(path).replace(/#/g, '%23');
