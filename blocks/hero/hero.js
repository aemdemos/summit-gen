/**
 * Hero block — two-layer animation (replicates gene.com hero):
 *
 *   Layer 1 (wordmark):  SVG text-mask wordmark + tagline revealed by an
 *                        entrance animation on page load.
 *
 *   Layer 2 (G-zoom):    Full-viewport illustration panel with a G-shaped
 *                        CSS mask-image.  Scroll-driven — opacity fades in,
 *                        mask grows from a small G letter to full-viewport
 *                        coverage, transitioning from the wordmark into the
 *                        raw illustration image.
 *
 * Animation sequence (matches gene.com):
 *   1. Page load   → entrance animation: illustration slides through wordmark,
 *                     tagline fades in.
 *   2. Scroll begins → G-zoom layer fades in (small G, illustration visible
 *                       through letter shape).
 *   3. Scroll continues → G grows exponentially; at ~17× viewport width the
 *                          G's outer edge is off-screen → full illustration.
 *   4. Hero unpins → rest of page scrolls normally.
 *
 * No external dependencies.
 *
 * @param {Element} block The hero block element
 */

// SVG wordmark constants (keep in sync with viewBox in buildSVG)
const SVG_WIDTH = 2000;
const SVG_HEIGHT = 450;
const IMAGE_WIDTH = SVG_WIDTH * 0.48; // illustration covers left ~55 % (≈ "Genen")
const IMAGE_X_START = -IMAGE_WIDTH; // off-screen left on load
const IMAGE_X_END = 0; // rests over left portion of wordmark

/** Cubic ease-in-out, t ∈ [0, 1]. */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Build inline SVG wordmark with two layers:
 *   1. Solid black <text> (always visible).
 *   2. <image clip-path> illustration that slides across the letterforms.
 * @param {string} wordmarkText
 * @param {string} imgSrc
 * @returns {{ svg: SVGElement, imgEl: SVGImageElement }}
 */
function buildSVG(wordmarkText, imgSrc) {
  // eslint-disable-next-line browser-security/no-http-urls, browser-security/detect-mixed-content
  const ns = 'http://www.w3.org/2000/svg'; // W3C SVG namespace — must use http:

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'hero-wordmark');
  svg.setAttribute('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS(ns, 'defs');
  const clipPath = document.createElementNS(ns, 'clipPath');
  clipPath.setAttribute('id', 'hero-text-clip');
  const clipText = document.createElementNS(ns, 'text');
  clipText.setAttribute('x', `${SVG_WIDTH / 2}`);
  clipText.setAttribute('y', '390');
  clipText.setAttribute('text-anchor', 'middle');
  clipText.setAttribute('font-family', 'gene-condensed, Arial Black, sans-serif');
  clipText.setAttribute('font-size', '420');
  clipText.setAttribute('font-weight', '700');
  clipText.textContent = wordmarkText;
  clipPath.append(clipText);
  defs.append(clipPath);
  svg.append(defs);

  // Solid black base
  const blackText = document.createElementNS(ns, 'text');
  blackText.setAttribute('x', `${SVG_WIDTH / 2}`);
  blackText.setAttribute('y', '390');
  blackText.setAttribute('text-anchor', 'middle');
  blackText.setAttribute('font-family', 'gene-condensed, Arial Black, sans-serif');
  blackText.setAttribute('font-size', '420');
  blackText.setAttribute('font-weight', '700');
  blackText.setAttribute('fill', 'black');
  blackText.textContent = wordmarkText;
  svg.append(blackText);

  // Illustration overlay (starts off-screen left)
  const imgEl = document.createElementNS(ns, 'image');
  imgEl.setAttribute('href', imgSrc);
  imgEl.setAttribute('x', `${IMAGE_X_START}`);
  imgEl.setAttribute('y', '-25');
  imgEl.setAttribute('width', `${IMAGE_WIDTH}`);
  imgEl.setAttribute('height', `${SVG_HEIGHT + 50}`);
  imgEl.setAttribute('preserveAspectRatio', 'xMinYMid slice');
  imgEl.setAttribute('clip-path', 'url(#hero-text-clip)');
  imgEl.setAttribute('class', 'hero-mask-image');
  svg.append(imgEl);

  return { svg, imgEl };
}

/**
 * Entrance animation: illustration slides left→right, tagline fades in.
 * Runs once on page load via rAF — no external dependencies.
 * @param {SVGImageElement} imgEl
 * @param {HTMLElement|null} taglineEl
 * @param {number} durationMs
 */
function playEntrance(imgEl, taglineEl, durationMs) {
  const start = performance.now();
  function tick(now) {
    const raw = Math.min(1, (now - start) / durationMs);
    imgEl.setAttribute('x', String(
      IMAGE_X_START + (IMAGE_X_END - IMAGE_X_START) * easeInOut(Math.min(1, raw / 0.8)),
    ));
    if (taglineEl) {
      taglineEl.style.opacity = String(Math.max(0, Math.min(1, (raw - 0.6) / 0.4)));
    }
    if (raw < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Wire up scroll-driven two-phase animation:
 *
 * Phase 1 (raw 0 → T): tagline fades out; wordmark unchanged.
 * Phase 2 (raw T → 1): wordmark slides right and scales up from the left edge,
 *   matching gene.com's observed values:
 *     start  → translateX(0px)       scale(1)
 *     end    → translateX(226.968px) scale(2.90526)
 *   with a p^1.2 ease-in curve that reproduces the slow-start acceleration.
 *
 * @param {HTMLElement} scrollPin        tall wrapper div (height = --hero-scroll-height)
 * @param {HTMLElement|null} tagline     tagline element — fades out in phase 1
 * @param {HTMLElement|null} heroContent wordmark container — slides/scales in phase 2
 */
function initScrollAnim(scrollPin, tagline, heroContent) {
  const wordmark = heroContent ? heroContent.querySelector('svg') : null;

  // raw value at which phase 1 ends and phase 2 begins (tagline fully gone)
  const T = 0.10;

  function update() {
    const rect = scrollPin.getBoundingClientRect();
    const scrollable = scrollPin.offsetHeight - window.innerHeight;
    const raw = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 1;

    // Phase 1: tagline fades from 1 → 0
    if (tagline) tagline.style.opacity = String(Math.max(0, 1 - raw / T));

    if (raw < T) {
      if (wordmark) wordmark.style.transform = '';
      return;
    }

    // Phase 2: wordmark zooms in and slides right.
    // p^1.2 ease-in: slow start that accelerates — matches gene.com's observed curve.
    const p = (raw - T) / (1 - T);
    const ease = p ** 1.2;
    if (wordmark) {
      const tx = ease * 226.968; // 0 → 226.968 px
      const sc = 1 + ease * 1.90526; // 1.0 → 2.90526
      wordmark.style.transformOrigin = 'left center';
      wordmark.style.transform = `translateX(${tx}px) scale(${sc})`;
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

export default async function decorate(block) {
  // ── Video variant ──────────────────────────────────────────────────────────
  if (block.classList.contains('video')) {
    const link = block.querySelector('a[href$=".mp4"]');
    if (link) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      const source = document.createElement('source');
      source.src = link.href;
      source.type = 'video/mp4';
      video.append(source);

      const wrapper = link.closest('div');
      wrapper.textContent = '';
      wrapper.classList.add('hero-video');
      wrapper.append(video);
    }
    return;
  }

  // ── Default variant ────────────────────────────────────────────────────────
  const img = block.querySelector('img');
  const h1 = block.querySelector('h1');
  if (!img || !h1) return;

  const wordmarkText = h1.textContent.trim();
  const imgSrc = img.src; // resolved absolute URL (750 px version)

  // Find tagline: first <p> after h1 with no embedded media
  let taglineText = '';
  let sibling = h1.nextElementSibling;
  while (sibling) {
    if (sibling.tagName === 'P' && !sibling.querySelector('picture, img')) {
      taglineText = sibling.textContent.trim();
      break;
    }
    sibling = sibling.nextElementSibling;
  }

  // ── Build DOM ──────────────────────────────────────────────────────────────
  block.textContent = '';

  // Layer 1: SVG wordmark + tagline
  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';

  const { svg, imgEl } = buildSVG(wordmarkText, imgSrc);
  heroContent.append(svg);

  // Visually-hidden real h1 for screen readers (SVG text is aria-hidden)
  const hiddenH1 = document.createElement('h1');
  hiddenH1.textContent = wordmarkText;
  hiddenH1.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
  heroContent.append(hiddenH1);

  let taglineEl = null;
  if (taglineText) {
    taglineEl = document.createElement('p');
    taglineEl.className = 'hero-tagline';
    taglineEl.textContent = taglineText;
    heroContent.append(taglineEl);
  }
  block.append(heroContent);

  // ── Scroll-pin setup ───────────────────────────────────────────────────────
  const section = block.closest('.section');
  const scrollPin = document.createElement('div');
  scrollPin.className = 'hero-scroll-pin';
  section.parentNode.insertBefore(scrollPin, section);
  scrollPin.append(section);
  section.classList.add('hero-pinned');

  // ── Start animations ───────────────────────────────────────────────────────
  // Wait for fonts so SVG text metrics and canvas G glyph are correct
  await document.fonts.ready;
  playEntrance(imgEl, taglineEl, 1500);
  initScrollAnim(scrollPin, taglineEl, heroContent);
}
