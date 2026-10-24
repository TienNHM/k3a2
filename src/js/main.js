// Entry point for every page: mount the shell (nav, transitions, cursor, footer), then the page's components.

import { mountShell } from './components/shell.js';
import { mountAll } from './core/registry.js';
import { reveal, ScrollTrigger } from './core/motion.js';

async function boot() {
  await mountShell();
  await mountAll();
  reveal();
  ScrollTrigger?.refresh();
  document.documentElement.classList.add('is-ready');
}

boot().catch((err) => console.error('[k3a2] boot failed', err));
