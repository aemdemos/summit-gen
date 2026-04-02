import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function buildNav(section) {
  const navEl = document.createElement('nav');
  navEl.className = 'footer-nav';
  navEl.setAttribute('aria-label', 'Footer navigation');
  const lists = [...section.querySelectorAll('ul')];
  if (lists.length === 0) return navEl;

  // Distribute lists into 4 visual columns: 2 + 3 + 4 + 2
  // Last column has Now Hiring + legal links (with — separator)
  // At 768+ CSS shows 3 nav columns (last wraps under col 3)
  // At 1024+ CSS shows all 4 nav columns
  const colSizes = [2, 3, 4, 2];
  let listIndex = 0;
  colSizes.forEach((count) => {
    const column = document.createElement('div');
    column.className = 'footer-nav-column';
    for (let j = 0; j < count && listIndex < lists.length; j += 1) {
      const col = document.createElement('div');
      col.className = 'footer-nav-col';
      col.append(lists[listIndex].cloneNode(true));
      column.append(col);
      listIndex += 1;
    }
    navEl.append(column);
  });
  return navEl;
}

function extractContent(section) {
  const wrapper = section.querySelector('.default-content-wrapper')
    || section.querySelector(':scope > div');
  const div = document.createElement('div');
  if (wrapper) [...wrapper.childNodes].forEach((child) => div.append(child));
  return div;
}

/**
 * Loads and decorates the Genentech footer.
 * Fragment sections (authored in DA): logo | nav | social | legal | copyright
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

  // Walk through sections and classify each by its content
  sections.forEach((section) => {
    const hasLists = section.querySelector('ul');
    const hasSocialLinks = section.querySelector('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"]');

    if (hasLists && !hasSocialLinks) {
      footer.append(buildNav(section));
    } else if (hasSocialLinks) {
      const div = extractContent(section);
      div.className = 'footer-social';
      footer.append(div);
    } else if (section.querySelector('img, .icon, picture')) {
      const div = extractContent(section);
      div.className = 'footer-logo';
      footer.append(div);
    } else {
      const div = extractContent(section);
      div.className = 'footer-copyright';
      footer.append(div);
    }
  });

  block.append(footer);
  await decorateIcons(footer);
}
