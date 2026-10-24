// The frame around every page: transitions, navigation, cursor, footer, entrance gate.

import { mountCurtain } from './curtain.js';
import { mountNav } from './nav.js';
import { mountCursor } from './cursor.js';
import { mountFooter } from './footer.js';
import { mountGate } from './gate.js';

export async function mountShell() {
  const { dataset } = document.body;
  mountCurtain();
  mountNav(dataset.key ?? dataset.page);
  mountCursor();
  if (dataset.footer !== 'off') mountFooter();
  if (dataset.gate === 'true') mountGate();
  else document.documentElement.classList.add('is-entered');
}
