// Small formatting helpers shared by components.

const ROMAN = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

/** 1 → "I", 4 → "IV", 12 → "XII" */
export function roman(n) {
  let out = '';
  for (const [value, symbol] of ROMAN) {
    while (n >= value) { out += symbol; n -= value; }
  }
  return out;
}

export const pad = (n, width = 2) => String(n).padStart(width, '0');

/** Joins the non-empty parts with a middle dot. */
export const dot = (...parts) => parts.filter(Boolean).join(' · ');
