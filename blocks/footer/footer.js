import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Loads and decorates the Genentech footer.
 * Fragment sections: logo | nav-columns | social | legal | copyright
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  const sections = [...fragment.children];

  const classNames = ['footer-logo', 'footer-nav', 'footer-social', 'footer-legal', 'footer-copyright'];

  sections.forEach((section, i) => {
    const div = document.createElement('div');
    div.className = classNames[i] || `footer-section-${i}`;

    // For the nav section, group lists into 3 columns (logo + 3 nav cols = 4 columns @768+)
    if (i === 1) {
      const navEl = document.createElement('nav');
      navEl.className = 'footer-nav';
      navEl.setAttribute('aria-label', 'Footer navigation');
      const lists = [...section.querySelectorAll('ul')];
      const numCols = 3;
      const n = lists.length;
      if (n === 0) {
        footer.append(navEl);
        return;
      }
      const base = Math.floor(n / numCols);
      const rem = n % numCols;
      let listIndex = 0;
      for (let c = 0; c < numCols; c += 1) {
        const count = base + (c < rem ? 1 : 0);
        const column = document.createElement('div');
        column.className = 'footer-nav-column';
        for (let j = 0; j < count; j += 1) {
          const col = document.createElement('div');
          col.className = 'footer-nav-col';
          col.append(lists[listIndex].cloneNode(true));
          column.append(col);
          listIndex += 1;
        }
        navEl.append(column);
      }
      footer.append(navEl);
      return;
    }

    // For other sections, move content from the first inner wrapper
    const wrapper = section.querySelector('.default-content-wrapper') || section.querySelector(':scope > div');
    if (wrapper) {
      [...wrapper.childNodes].forEach((child) => div.append(child));
    }
    footer.append(div);
  });

  block.append(footer);
  await decorateIcons(footer);
}
