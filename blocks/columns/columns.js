import { getBlockId } from '../../scripts/scripts.js';

/**
 * Hero illustration URL (same asset as the section above this block).
 * @returns {string}
 */
function getHeroIllustrationUrl() {
  const heroSource = document.querySelector('.hero picture source');
  const heroImgEl = document.querySelector('.hero img');
  return heroSource?.srcset?.split(',')[0]?.trim()?.split(' ')[0]
    || heroImgEl?.currentSrc || heroImgEl?.src || '';
}

/**
 * Full-viewport slide shell uses the same image as the hero for continuity.
 * @param {HTMLElement} section
 * @param {string} src
 */
function setSlideSectionBackdrop(section, src) {
  if (!src) return;
  const safe = src.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  section.style.setProperty('--columns-slide-bg-image', `url("${safe}")`);
}

/**
 * Try to find the hero illustration source for the "50" mask background.
 * @param {HTMLElement} maskDiv
 * @returns {boolean} true if background was set
 */
function applyMaskBackground(maskDiv) {
  const src = getHeroIllustrationUrl();
  if (src) {
    maskDiv.style.backgroundImage = `url('${src}')`;
    maskDiv.style.backgroundSize = 'cover';
    maskDiv.style.backgroundPosition = 'center';
    return true;
  }
  return false;
}

export default function decorate(block) {
  const blockId = getBlockId('columns');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `columns-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Columns');

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // "50" mask effect: in warm-gray section, the authored "50" PNG is the mask shape.
  // The illustration background shows through the "50" letter shapes.
  // Shell: 100vh with hero-matched backdrop; inner panel: warm-gray band with columns.
  const section = block.closest('.section');
  if (section && section.classList.contains('warm-gray')) {
    const imgCol = block.querySelector('.columns-img-col');
    const img = imgCol?.querySelector('img');
    if (imgCol && img) {
      section.classList.add('columns-slide-section');
      block.classList.add('columns-gene-slide');
      const panel = block.parentElement;
      if (panel) panel.classList.add('columns-gene-slide-panel');

      /* Root scroll-snap (gene.com: slide “lands” when this section nears the viewport). */
      document.documentElement.classList.add('columns-gene-slide-snap');

      const syncBackdrop = () => {
        const src = getHeroIllustrationUrl();
        if (src) setSlideSectionBackdrop(section, src);
        return Boolean(src);
      };
      if (!syncBackdrop()) {
        const backdropObserver = new MutationObserver(() => {
          if (syncBackdrop()) backdropObserver.disconnect();
        });
        backdropObserver.observe(document.querySelector('main') || document.body, {
          childList: true, subtree: true,
        });
        setTimeout(() => {
          if (!section.style.getPropertyValue('--columns-slide-bg-image')) {
            setSlideSectionBackdrop(section, '/images/hero/hero-desktop.jpg');
          }
          backdropObserver.disconnect();
        }, 5000);
      }

      const maskSrc = img.currentSrc || img.src;
      img.style.opacity = '0';

      const maskDiv = document.createElement('div');
      maskDiv.className = 'columns-50-mask';

      // Simple mask: "50" shape = visible area, illustration shows through
      maskDiv.style.maskImage = `url('${maskSrc}')`;
      maskDiv.style.webkitMaskImage = `url('${maskSrc}')`;

      // Set the hero illustration as the background
      if (!applyMaskBackground(maskDiv)) {
        const maskObserver = new MutationObserver(() => {
          if (applyMaskBackground(maskDiv)) maskObserver.disconnect();
        });
        maskObserver.observe(document.querySelector('main') || document.body, {
          childList: true, subtree: true,
        });
        setTimeout(() => {
          if (!maskDiv.style.backgroundImage || maskDiv.style.backgroundImage === 'none') {
            maskDiv.style.backgroundImage = "url('/images/hero/hero-desktop.jpg')";
            maskDiv.style.backgroundSize = 'cover';
            maskDiv.style.backgroundPosition = 'center';
          }
          maskObserver.disconnect();
        }, 5000);
      }

      imgCol.append(maskDiv);
    }
  }
}
