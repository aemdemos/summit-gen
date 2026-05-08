import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Loads and decorates the Manulife Wealth footer.
 * Fragment sections: 1) logo + nav links, 2) copyright, 3) link columns
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'footer-content';

  const sections = [...fragment.children];

  // Section 1: Upper part — logo + nav links
  if (sections[0]) {
    const upper = document.createElement('div');
    upper.className = 'footer-upper';

    // Find picture and ul within the section (may be in default-content-wrapper)
    const pic = sections[0].querySelector('picture');
    if (pic) {
      const logoDiv = document.createElement('div');
      logoDiv.className = 'footer-logo';
      logoDiv.append(pic.cloneNode(true));
      upper.append(logoDiv);
    }
    const ul = sections[0].querySelector('ul');
    if (ul) {
      const navEl = document.createElement('nav');
      navEl.className = 'footer-nav';
      navEl.setAttribute('aria-label', 'Footer navigation');
      navEl.append(ul.cloneNode(true));
      upper.append(navEl);
    }
    container.append(upper);
  }

  // Divider
  const hr = document.createElement('hr');
  hr.className = 'footer-divider';
  container.append(hr);

  // Section 2: Copyright
  if (sections[1]) {
    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'footer-copyright';
    const p = sections[1].querySelector('p');
    if (p) copyrightDiv.append(p.cloneNode(true));
    container.append(copyrightDiv);
  }

  // Section 3: Link columns — each wrapper div contains a heading <p><strong> + <ul>
  if (sections[2]) {
    const columnsDiv = document.createElement('div');
    columnsDiv.className = 'footer-columns';

    // Look for all <p> with <strong> and subsequent <ul> in this section
    const allP = sections[2].querySelectorAll('p');
    allP.forEach((p) => {
      if (p.querySelector('strong')) {
        const col = document.createElement('div');
        col.className = 'footer-col';
        col.append(p.cloneNode(true));
        // Find the next sibling UL
        let next = p.nextElementSibling;
        while (next && next.tagName !== 'UL') {
          next = next.nextElementSibling;
        }
        if (next && next.tagName === 'UL') {
          col.append(next.cloneNode(true));
        }
        columnsDiv.append(col);
      }
    });

    container.append(columnsDiv);
  }

  block.append(container);
}
