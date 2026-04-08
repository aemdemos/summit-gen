import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

/**
 * @param {Element} el
 */
function replaceHeadingWithH3(el) {
  const h3 = document.createElement('h3');
  moveInstrumentation(el, h3);
  let moves = 0;
  const maxMoves = 256;
  while (el.firstChild && moves < maxMoves) {
    h3.append(el.firstChild);
    moves += 1;
  }
  const attrs = el.attributes;
  const attrLen = Math.min(attrs.length, 64);
  for (let j = 0; j < attrLen; j += 1) {
    const a = attrs[j];
    h3.setAttribute(a.name, a.value);
  }
  el.replaceWith(h3);
}

/**
 * Each card’s first heading becomes h3 so sibling cards don’t mix levels (e.g. h5 then h4),
 * which fails “sequentially-descending order” in accessibility audits.
 * @param {HTMLUListElement} ul
 */
function normalizeFirstHeadingPerCard(ul) {
  const lis = ul.children;
  const cap = Math.min(lis.length, 128);
  for (let i = 0; i < cap; i += 1) {
    const li = lis[i];
    if (li.tagName === 'LI') {
      const el = li.querySelector('h1, h2, h3, h4, h5, h6');
      if (el && el.tagName !== 'H3') replaceHeadingWithH3(el);
    }
  }
}

export default function decorate(block) {
  const blockId = getBlockId('cards');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    ul.append(createCard(row));
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
  normalizeFirstHeadingPerCard(ul);
}
