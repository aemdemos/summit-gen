import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// gene.com uses hamburger at all sizes; this query is kept for escape/focus behavior
const isDesktop = window.matchMedia('(min-width: 900px)');
const isLargeDesktop = window.matchMedia('(min-width: 1200px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    // eslint-disable-next-line no-use-before-define
    toggleMenu(nav, navSections, false);
    nav.querySelector('button').focus();
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (e.relatedTarget && !nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    // eslint-disable-next-line no-use-before-define
    toggleMenu(nav, navSections, false);
  }
}

function closeOnClickOutside(e) {
  const nav = document.getElementById('nav');
  if (!nav || nav.getAttribute('aria-expanded') !== 'true') return;
  // ignore clicks inside nav or on the search button
  if (nav.contains(e.target) || e.target.closest('.nav-tools')) return;
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;
  // eslint-disable-next-line no-use-before-define
  toggleMenu(nav, navSections, false);
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  // at 1024+ the nav is a card panel; don't lock body scroll
  document.body.style.overflowY = (expanded || isLargeDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }

  // at 1024+, close menu on click outside the nav card
  if (!expanded && isLargeDesktop.matches) {
    // slight delay so the opening click doesn't immediately close
    setTimeout(() => document.addEventListener('click', closeOnClickOutside), 0);
  } else {
    document.removeEventListener('click', closeOnClickOutside);
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > :where(a,p)');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

const MAX_BREADCRUMB_DEPTH = 20;

async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
  const crumbs = [];

  const homeUrl = document.querySelector('.nav-brand a[href]').href;

  let menuItem = Array.from(nav.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    let depth = 0;
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
      depth += 1;
    } while (menuItem && depth < MAX_BREADCRUMB_DEPTH);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  crumbs.unshift({ title: 'Home', url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs.at(-1).url = null;
  }
  crumbs.at(-1)['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(document.querySelector('.nav-sections'), document.location.href);

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));

  breadcrumbs.append(ol);
  return breadcrumbs;
}

/**
 * Assigns nav-brand / nav-sections / nav-tools classes.
 * When the fragment has only one section (e.g. DA nav), splits it
 * into a brand section and a sections section programmatically.
 */
function classifyNavSections(nav) {
  if (nav.children.length === 1) {
    const single = nav.children[0];
    const wrapper = single.querySelector('.default-content-wrapper') || single;
    const brandLink = wrapper.querySelector('p > a');
    const brandP = brandLink ? brandLink.closest('p') : null;
    const brandSection = document.createElement('div');
    brandSection.className = 'section nav-brand';
    if (brandP) {
      brandSection.appendChild(brandP.cloneNode(true));
      brandP.remove();
    }
    single.classList.add('nav-sections');
    single.classList.remove('nav-brand');
    nav.insertBefore(brandSection, single);
  } else {
    ['brand', 'sections', 'tools'].forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });
  }
}

/**
 * Decorates nav-sections with dropdown and click behaviour.
 */
function decorateNavSections(navSections) {
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
    if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
    navSection.addEventListener('click', () => {
      if (isDesktop.matches) {
        const expanded = navSection.getAttribute('aria-expanded') === 'true';
        toggleAllNavSections(navSections);
        navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      }
    });
  });
  navSections.querySelectorAll('.button-container').forEach((bc) => {
    bc.classList.remove('button-container');
    bc.querySelector('.button').classList.remove('button');
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  classifyNavSections(nav);

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandBtn = navBrand.querySelector('.button');
    if (brandBtn) {
      brandBtn.className = '';
      brandBtn.closest('.button-container').className = '';
    }
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.classList.add('nav-brand-link');
      const logo = document.createElement('span');
      logo.className = 'icon icon-genentech-logo';
      brandLink.prepend(logo);
      decorateIcons(navBrand);
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) decorateNavSections(navSections);

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const search = navTools.querySelector('a[href*="search"]');
    if (search) {
      search.setAttribute('aria-label', 'Search');
      search.textContent = '';
      const searchIcon = document.createElement('span');
      searchIcon.className = 'icon icon-search';
      search.append(searchIcon);
      decorateIcons(navTools);
    }
  }

  // hamburger — always visible (gene.com uses hamburger at all sizes)
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, false);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
