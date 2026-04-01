import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const SOCIAL_LINKS = [
  { href: 'https://facebook.com/genentech', icon: 'facebook' },
  { href: 'https://twitter.com/genentech', icon: 'twitter' },
  { href: 'https://linkedin.com/company/genentech', icon: 'linkedin' },
  { href: 'https://youtube.com/genentech', icon: 'youtube' },
  { href: 'https://pinterest.com/genentech', icon: 'pinterest' },
  { href: 'https://www.glassdoor.com/Overview/Working-at-Genentech-EI_IE274.11,20.htm', icon: 'glassdoor' },
  { href: 'https://instagram.com/genentech', icon: 'instagram' },
];

function buildLogo() {
  const div = document.createElement('div');
  div.className = 'footer-logo';
  div.innerHTML = '<p><a href="/"><span class="icon icon-genentech-footer-logo"></span></a></p>';
  return div;
}

function buildSocial() {
  const div = document.createElement('div');
  div.className = 'footer-social';
  const p = document.createElement('p');
  SOCIAL_LINKS.forEach(({ href, icon }) => {
    const a = document.createElement('a');
    a.href = href;
    a.setAttribute('aria-label', icon);
    a.innerHTML = `<span class="icon icon-${icon}"></span>`;
    p.append(a);
  });
  div.append(p);
  return div;
}

function buildNav(section) {
  const navEl = document.createElement('nav');
  navEl.className = 'footer-nav';
  navEl.setAttribute('aria-label', 'Footer navigation');
  const lists = [...section.querySelectorAll('ul')];
  if (lists.length === 0) return navEl;

  // Distribute lists into 3 visual columns: 2 + 4 + 4
  const colSizes = [2, 4, 4];
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
 * DA content has 3 sections: nav | legal | copyright
 * Code adds logo and social icons (icon SVGs live in the repo, not DA).
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

  // Detect whether fragment has 5 sections (full) or 3 sections (DA: nav, legal, copyright)
  const hasFiveSections = sections.length >= 5;

  if (hasFiveSections) {
    // Full fragment: logo | nav | social | legal | copyright
    footer.append(extractContent(sections[0]));
    footer.firstElementChild.className = 'footer-logo';
    footer.append(buildNav(sections[1]));
    const social = extractContent(sections[2]);
    social.className = 'footer-social';
    footer.append(social);
    const legal = extractContent(sections[3]);
    legal.className = 'footer-legal';
    footer.append(legal);
    const copy = extractContent(sections[4]);
    copy.className = 'footer-copyright';
    footer.append(copy);
  } else {
    // DA fragment: nav | legal | copyright — build logo + social from code
    footer.append(buildLogo());
    footer.append(buildNav(sections[0]));
    footer.append(buildSocial());
    const legal = extractContent(sections[1]);
    legal.className = 'footer-legal';
    footer.append(legal);
    const copy = extractContent(sections[2]);
    copy.className = 'footer-copyright';
    footer.append(copy);
  }

  block.append(footer);
  await decorateIcons(footer);
}
