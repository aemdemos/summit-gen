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

  // Distribute lists into 4 visual columns: 2 + 3 + 4 + 1
  // At 768+ CSS shows 3 nav columns (last wraps under col 3)
  // At 1024+ CSS shows all 4 nav columns
  const colSizes = [2, 3, 4, 1];
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

  // Detect section layout by checking if first section has nav lists or is a logo
  const firstHasLists = sections[0]?.querySelector('ul');
  let navIdx;

  if (firstHasLists) {
    // No logo section from DA — build from code
    footer.append(buildLogo());
    navIdx = 0;
  } else {
    // First section is the logo (image or icon link from DA)
    const logo = extractContent(sections[0]);
    logo.className = 'footer-logo';
    footer.append(logo);
    navIdx = 1;
  }

  // Nav section (contains all the <ul> lists)
  footer.append(buildNav(sections[navIdx]));

  // Social section — check if next section has social links, otherwise build from code
  const socialIdx = navIdx + 1;
  const socialSection = sections[socialIdx];
  const hasSocialLinks = socialSection?.querySelector('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"]');
  if (hasSocialLinks) {
    const social = extractContent(socialSection);
    social.className = 'footer-social';
    footer.append(social);
  } else {
    footer.append(buildSocial());
  }

  // Remaining sections: legal then copyright
  const legalIdx = hasSocialLinks ? socialIdx + 1 : socialIdx;
  if (sections[legalIdx]) {
    const legal = extractContent(sections[legalIdx]);
    legal.className = 'footer-legal';
    footer.append(legal);
  }
  if (sections[legalIdx + 1]) {
    const copy = extractContent(sections[legalIdx + 1]);
    copy.className = 'footer-copyright';
    footer.append(copy);
  }

  block.append(footer);
  await decorateIcons(footer);
}
