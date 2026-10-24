// Component registry. A page is HTML plus `data-component="name"` hooks; each name below maps to
// a module whose default export is `mount(el, ctx)`. To add a section:
//   1. create src/js/components/my-thing.js  (export default function mount(el) { ... })
//   2. register it here
//   3. put <section data-component="my-thing"></section> in any page
// Modules load lazily, so a page only downloads the components it uses.

export const registry = {
  hero: () => import('../components/hero.js'),
  marquee: () => import('../components/marquee.js'),
  timeline: () => import('../components/timeline.js'),
  doors: () => import('../components/doors.js'),
  timemachine: () => import('../components/timemachine.js'),
  moment: () => import('../components/moment.js'),
  invitation: () => import('../components/invitation.js'),
  'room-view': () => import('../components/room-view.js'),
  'page-header': () => import('../components/page-header.js'),
  people: () => import('../components/people.js'),
  wishes: () => import('../components/wishes.js'),
  places: () => import('../components/places.js'),
  videos: () => import('../components/videos.js'),
};

/**
 * Mounts every [data-component] under `root`. Options come from the element's data-* attributes
 * (el.dataset). A component may return a cleanup function; it is kept for completeness.
 * @returns {Promise<void>}
 */
export async function mountAll(root = document) {
  const targets = [...root.querySelectorAll('[data-component]')];
  await Promise.all(
    targets.map(async (el) => {
      const name = el.dataset.component;
      const loader = registry[name];
      if (!loader) return console.warn(`[k3a2] unknown component "${name}"`);
      try {
        const mod = await loader();
        await mod.default(el, { name });
      } catch (err) {
        console.error(`[k3a2] component "${name}" failed`, err);
      }
    }),
  );
}
