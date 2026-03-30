import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (nav && nav.getAttribute('aria-expanded') === 'true') {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, false);
    }
  }
}

/**
 * Toggles the nav menu open/closed
 * @param {Element} nav The nav element
 * @param {boolean|null} forceExpanded Force state
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const menuBtn = nav.querySelector('.nav-menu-btn');
  const hamburgerIcon = menuBtn?.querySelector('.icon-hamburger');
  const closeIcon = menuBtn?.querySelector('.icon-close');

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  menuBtn?.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  if (hamburgerIcon) hamburgerIcon.style.display = expanded ? '' : 'none';
  if (closeIcon) closeIcon.style.display = expanded ? 'none' : '';

  document.body.style.overflowY = expanded ? '' : 'hidden';

  if (!expanded) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Builds the nav-links row from an <ul> of top-level links
 * @param {Element} ul The unordered list element
 * @returns {Element}
 */
function buildNavLinks(ul) {
  const navLinks = document.createElement('nav');
  navLinks.className = 'nav-links';
  navLinks.setAttribute('aria-label', 'Main navigation');
  ul.querySelectorAll(':scope > li > a').forEach((a) => {
    const link = a.cloneNode(true);
    navLinks.append(link);
  });
  return navLinks;
}

/**
 * Builds the quick links section
 * @param {string} label The label text
 * @param {Element} ul The quick links list
 * @returns {Element}
 */
function buildQuickLinks(label, ul) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-quick-links';

  const labelEl = document.createElement('div');
  labelEl.className = 'nav-quick-links-label';
  labelEl.textContent = label;
  wrapper.append(labelEl);

  const list = document.createElement('ul');
  ul.querySelectorAll(':scope > li > a').forEach((a) => {
    const li = document.createElement('li');
    const link = a.cloneNode(true);
    li.append(link);
    list.append(li);
  });
  wrapper.append(list);

  return wrapper;
}

/**
 * Builds the featured article card
 * @param {string} title Card title
 * @param {string} description Card description
 * @param {string} href Card link
 * @param {Element} picture Card image
 * @returns {Element}
 */
function buildFeaturedCard(title, description, href, picture) {
  const card = document.createElement('a');
  card.className = 'nav-featured-card';
  card.href = href;

  const textDiv = document.createElement('div');
  textDiv.className = 'nav-featured-text';

  const h3 = document.createElement('h3');
  h3.textContent = title;
  textDiv.append(h3);

  const p = document.createElement('p');
  p.textContent = description;
  textDiv.append(p);

  card.append(textDiv);

  if (picture) {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'nav-featured-image';
    imgDiv.append(picture);

    const arrow = document.createElement('span');
    arrow.className = 'icon icon-arrow-right';
    imgDiv.append(arrow);

    card.append(imgDiv);
  }

  return card;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  if (!fragment) return;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Collect sections from fragment
  const sections = [...fragment.children];

  // Section 0: Brand (logo)
  const brandSection = sections[0];
  const brandLink = brandSection?.querySelector('a');

  // Section 1: Navigation content (links, quick links, featured card)
  const navSection = sections[1];
  const lists = navSection?.querySelectorAll(':scope ul');
  const navLinksUl = lists?.[0]; // main nav links
  const quickLinksUl = lists?.[1]; // quick links

  // Quick links label from h6
  const quickLinksH6 = navSection?.querySelector('h6');
  const quickLinksLabel = quickLinksH6?.textContent || 'Quick Links:';

  // Featured card from h3 + p + picture
  const featuredH3 = navSection?.querySelector('h3');
  const featuredLink = featuredH3?.querySelector('a');
  const featuredTitle = featuredH3?.textContent || '';
  const featuredHref = featuredLink?.getAttribute('href') || '';
  // Description is first p after h3
  const featuredDesc = featuredH3?.nextElementSibling?.tagName === 'P'
    ? featuredH3.nextElementSibling.textContent
    : '';
  const featuredPicture = navSection?.querySelector('picture');

  // Section 2: Tools (search)
  const toolsSection = sections[2];

  // --- Build the header DOM ---

  // 1. Menu button (hamburger/close)
  const menuBtn = document.createElement('button');
  menuBtn.className = 'nav-menu-btn';
  menuBtn.type = 'button';
  menuBtn.setAttribute('aria-controls', 'nav');
  menuBtn.setAttribute('aria-label', 'Open navigation');
  const hamburgerSpan = document.createElement('span');
  hamburgerSpan.className = 'icon icon-hamburger';
  const closeSpan = document.createElement('span');
  closeSpan.className = 'icon icon-close';
  closeSpan.style.display = 'none';
  menuBtn.append(hamburgerSpan, closeSpan);
  menuBtn.addEventListener('click', () => toggleMenu(nav));

  // 2. Menu panel (content shown when open)
  const menuPanel = document.createElement('div');
  menuPanel.className = 'nav-panel';

  // 2a. Logo
  const logo = document.createElement('div');
  logo.className = 'nav-logo';
  if (brandLink) {
    const logoLink = document.createElement('a');
    logoLink.href = brandLink.getAttribute('href') || '/';
    logoLink.setAttribute('aria-label', 'Genentech home');
    const wordmark = document.createElement('span');
    wordmark.className = 'icon icon-genentech-wordmark';
    logoLink.append(wordmark);
    logo.append(logoLink);
  }

  // 2b. Nav links
  const navLinksEl = navLinksUl ? buildNavLinks(navLinksUl) : document.createElement('nav');

  // 2c. Quick links
  const quickLinksEl = quickLinksUl
    ? buildQuickLinks(quickLinksLabel, quickLinksUl)
    : document.createElement('div');

  // 2d. Featured card
  const featuredCard = featuredTitle
    ? buildFeaturedCard(featuredTitle, featuredDesc, featuredHref, featuredPicture)
    : document.createElement('div');

  // Assemble panel grid
  menuPanel.append(logo, navLinksEl, quickLinksEl, featuredCard);

  // 3. Search button
  const searchBtn = document.createElement('div');
  searchBtn.className = 'nav-search';
  if (toolsSection) {
    const searchLink = toolsSection.querySelector('a');
    if (searchLink) {
      const searchA = document.createElement('a');
      searchA.href = searchLink.getAttribute('href') || '/search';
      searchA.setAttribute('aria-label', 'Search');
      const searchIcon = document.createElement('span');
      searchIcon.className = 'icon icon-search';
      searchA.append(searchIcon);
      searchBtn.append(searchA);
    }
  }

  // Assemble nav
  nav.append(menuBtn, menuPanel, searchBtn);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Decorate icons
  const { decorateIcons } = await import('../../scripts/aem.js');
  await decorateIcons(nav);
}
