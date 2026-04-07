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

const firstSrcsetUrl = (srcset) => srcset.split(',')[0]?.trim()?.split(/\s+/)[0] || '';

/**
 * Same breakpoint can list WebP then PNG; `mask-image` is more reliable with PNG alpha.
 * @param {HTMLSourceElement[]} sources
 * @param {string} media
 * @returns {string}
 */
function firstSrcsetUrlForMedia(sources, media) {
  const same = sources.filter((s) => (s.media || '') === media);
  const png = same.find((s) => /image\/png/i.test(s.type || ''));
  if (png?.srcset) return firstSrcsetUrl(png.srcset);
  const jpeg = same.find((s) => /image\/jpe?g/i.test(s.type || ''));
  if (jpeg?.srcset) return firstSrcsetUrl(jpeg.srcset);
  const any = same.find((s) => s.srcset);
  return any ? firstSrcsetUrl(any.srcset) : '';
}

/**
 * @param {HTMLSourceElement[]} sources
 * @param {number} vw
 * @returns {string}
 */
function pickSrcFromPictureSources(sources, vw) {
  if (vw >= 1280) {
    const lg = sources.find((s) => /min-width:\s*1280/.test(s.media || ''));
    if (lg?.srcset) return firstSrcsetUrlForMedia(sources, lg.media || '');
  }
  if (vw >= 960) {
    const md = sources.find((s) => /min-width:\s*960/.test(s.media || ''))
      || sources.find((s) => /min-width:\s*900/.test(s.media || ''))
      || sources.find((s) => /min-width:\s*600/.test(s.media || ''));
    if (md?.srcset) return firstSrcsetUrlForMedia(sources, md.media || '');
  } else if (vw >= 600) {
    const sm = sources.find((s) => /min-width:\s*600/.test(s.media || ''));
    if (sm?.srcset) return firstSrcsetUrlForMedia(sources, sm.media || '');
  }
  const uncond = sources.find((s) => !s.media);
  if (uncond?.srcset) return firstSrcsetUrlForMedia(sources, uncond.media || '');
  if (sources[0]?.srcset) return firstSrcsetUrl(sources[0].srcset);
  return '';
}

/**
 * StoryApp `x`: prefer responsive <source> by viewport; fall back so URL is never empty when img exists.
 * @param {HTMLImageElement} img
 * @returns {string}
 */
function pickImageBackgroundSrcForViewport(img) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const picture = img.closest('picture');
  if (!picture) return '';
  const sources = [...picture.querySelectorAll('source[srcset]')];
  return pickSrcFromPictureSources(sources, vw);
}

/**
 * URL for StoryApp mask `url(x)` — browser-chosen asset first, then pick(), then raw src.
 * @param {HTMLImageElement} img
 * @returns {string}
 */
function resolveImageBackgroundMaskUrl(img) {
  /* Lazy `img`: currentSrc may be empty before layout; attribute `src` is always a valid mask URL. */
  return pickImageBackgroundSrcForViewport(img)
    || img.getAttribute('src')
    || img.src
    || img.currentSrc
    || '';
}

/** Resolve relative URLs — Chrome often fails mask-image with `./media…` paths. */
function toMaskUrl(href) {
  if (!href) return '';
  try {
    return new URL(href, document.baseURI).href;
  } catch {
    return href;
  }
}

/** Safe `url("...")` for mask-image (handles quotes in path). */
function cssUrlValue(href) {
  const abs = toMaskUrl(href);
  const safe = abs.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `url("${safe}")`;
}

/**
 * StoryApp bar-image-container inline styles (CgR3EhWF.js ~12503–12507) + URji_XlK.css xor/exclude.
 * maskImage: `url(x), linear-gradient(black, black)` — never leave mask at `none` when `x` is valid.
 * @param {HTMLElement} imgCol
 * @param {string|null} imageBackgroundSrc
 */
function applyFlexibleCtaBarMask(imgCol, imageBackgroundSrc) {
  imgCol.style.backgroundColor = 'rgb(235, 230, 224)';
  imgCol.style.flexShrink = '0';
  imgCol.style.transform = 'translateZ(0)';

  if (!imageBackgroundSrc || imageBackgroundSrc === '') {
    imgCol.style.maskImage = 'none';
    imgCol.style.webkitMaskImage = 'none';
    return;
  }

  /*
   * Asset: opaque “50” on transparent. Single-layer mask would paint gray only on the digits.
   * StoryApp stack: url(image) + full opaque plane, xor/exclude → overlap clears → gray bar with transparent “50”.
   */
  const stack = `${cssUrlValue(imageBackgroundSrc)}, linear-gradient(#000 0 0)`;
  imgCol.style.maskImage = stack;
  imgCol.style.webkitMaskImage = stack;
}

/**
 * StoryApp F1: preload `image_background`; empty src must still invoke callback (otherwise mask stays none).
 * @param {string} src
 * @param {() => void} onReady
 */
function preloadImageBackground(src, onReady) {
  if (!src) {
    queueMicrotask(onReady);
    return;
  }
  const probe = new Image();
  let called = false;
  const done = () => {
    if (called) return;
    called = true;
    onReady();
  };
  probe.addEventListener('load', done, { once: true });
  probe.addEventListener('error', done, { once: true });
  probe.src = src;
  if (probe.complete) done();
}

export default function decorate(block) {
  const blockId = getBlockId('columns');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `columns-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Columns');

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

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

  const section = block.closest('.section');
  if (section && section.classList.contains('warm-gray')) {
    const imgCol = block.querySelector('.columns-img-col');
    const img = imgCol?.querySelector('img');
    if (imgCol && img) {
      section.classList.add('columns-slide-section');
      block.classList.add('columns-gene-slide', 'columns-flexible-cta-image-left');
      const panel = block.parentElement;
      if (panel) panel.classList.add('columns-gene-slide-panel');

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

      img.style.opacity = '0';
      img.style.pointerEvents = 'none';
      img.setAttribute('aria-hidden', 'true');

      imgCol.classList.add('columns-flexible-cta-bar-image', 'with-mask');

      const paintBar = () => {
        const url = resolveImageBackgroundMaskUrl(img);
        applyFlexibleCtaBarMask(imgCol, url || null);
      };

      paintBar();
      preloadImageBackground(resolveImageBackgroundMaskUrl(img), paintBar);
      img.addEventListener('load', paintBar, { once: true });

      requestAnimationFrame(() => {
        requestAnimationFrame(paintBar);
      });

      const onResize = () => {
        paintBar();
        preloadImageBackground(resolveImageBackgroundMaskUrl(img), paintBar);
      };
      window.addEventListener('resize', onResize, { passive: true });
    }
  }
}
