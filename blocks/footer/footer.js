import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function buildNav(navSection, legalSection) {
  const navEl = document.createElement('nav');
  navEl.className = 'footer-nav';
  navEl.setAttribute('aria-label', 'Footer navigation');

  // Collect all nav ULs
  const lists = [...navSection.querySelectorAll('ul')].map((ul) => ul.cloneNode(true));

  // Merge legal links as the last UL (under Now Hiring)
  if (legalSection) {
    const legalUl = legalSection.querySelector('ul');
    if (legalUl) {
      const clone = legalUl.cloneNode(true);
      const firstLi = clone.querySelector('li');
      if (firstLi && firstLi.textContent.trim() !== '—') {
        const sep = document.createElement('li');
        sep.textContent = '—';
        clone.prepend(sep);
      }
      lists.push(clone);
    }
  }

  // Group lists into 4 explicit columns: [2, 3, 4, 2]
  // Col 1: For Patients, About Us
  // Col 2: Contact Us, For Medical Professionals, For Partners
  // Col 3: For Scientists, For Media, For Good, Inclusion & Belonging
  // Col 4: Now Hiring, legal links
  const colSizes = [2, 3, 4, 2];
  let idx = 0;
  colSizes.forEach((size) => {
    const col = document.createElement('div');
    col.className = 'footer-nav-column';
    for (let j = 0; j < size && idx < lists.length; j += 1) {
      col.append(lists[idx]);
      idx += 1;
    }
    navEl.append(col);
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

function buildSocialDiv(section) {
  const div = document.createElement('div');
  div.className = 'footer-social';
  // DA may split icons into separate <p> tags — collect all links into one <p>
  const links = section.querySelectorAll('a');
  const p = document.createElement('p');
  links.forEach((a) => p.append(a.cloneNode(true)));
  div.append(p);
  return div;
}

/**
 * Loads and decorates the Genentech footer.
 * Fragment sections (authored in DA): logo | nav | social | legal | copyright
 * Legal links are merged into the nav as the last column.
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

  // Classify sections
  let navSection = null;
  let legalSection = null;
  let socialSection = null;
  const otherSections = [];

  sections.forEach((section) => {
    const lists = section.querySelectorAll('ul');
    const hasSocialLinks = section.querySelector(
      'a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"]',
    );
    const hasImage = section.querySelector('img, .icon, picture');
    const listCount = lists.length;

    if (hasSocialLinks) {
      socialSection = section;
    } else if (listCount > 3) {
      // Main nav section (many lists)
      navSection = section;
    } else if (listCount >= 1 && listCount <= 3 && !hasImage) {
      // Small list section = legal links
      legalSection = section;
    } else if (hasImage) {
      const div = extractContent(section);
      div.className = 'footer-logo';
      otherSections.push({ type: 'logo', el: div });
    } else {
      const div = extractContent(section);
      div.className = 'footer-copyright';
      otherSections.push({ type: 'copyright', el: div });
    }
  });

  // Assemble footer: logo, nav (with legal merged), social, copyright
  const logo = otherSections.find((s) => s.type === 'logo');
  if (logo) footer.append(logo.el);

  if (navSection) footer.append(buildNav(navSection, legalSection));

  if (socialSection) footer.append(buildSocialDiv(socialSection));

  const copyright = otherSections.find((s) => s.type === 'copyright');
  if (copyright) footer.append(copyright.el);

  block.append(footer);
  await decorateIcons(footer);
}
