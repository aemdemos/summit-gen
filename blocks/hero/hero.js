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
 * Render "G" glyph to an off-screen canvas using the loaded gene-condensed
 * font, then return a PNG data URL for use as CSS mask-image.
 * Returns null if canvas is unavailable.
 */
function buildGMaskUrl() {
  try {
    const canvas = document.createElement('canvas');
    const res = 512;
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = 'white';
    ctx.font = `700 ${Math.round(res * 0.88)}px gene-condensed, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('G', res * 0.5, res * 0.88);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Wire up scroll-driven G-zoom animation.
 *
 * Mask-size grows exponentially with a quadratic ease-in (slow start →
 * explosive finish) matching the gene.com animation curve extracted from
 * its computed style data.
 *
 * Anchor formula keeps the G's visual center fixed at (50 % vw, 52 % vh)
 * so the letter appears to expand outward from the viewport center.
 *
 * @param {HTMLElement} scrollPin    tall wrapper div (height = --hero-scroll-height)
 * @param {HTMLElement} gZoom        illustration panel with G mask
 * @param {HTMLElement|null} tagline tagline element to fade out in sync
 */
function initGZoom(scrollPin, gZoom, tagline) {
  const maskUrl = buildGMaskUrl();
  if (!maskUrl) return; // canvas unsupported — skip G-zoom gracefully

  // Apply G mask (webkit prefix for Safari)
  gZoom.style.webkitMaskImage = `url('${maskUrl}')`;
  gZoom.style.maskImage = `url('${maskUrl}')`;
  gZoom.style.webkitMaskRepeat = 'no-repeat';
  gZoom.style.maskRepeat = 'no-repeat';

  function update() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = scrollPin.getBoundingClientRect();
    const scrollable = scrollPin.offsetHeight - vh;
    const raw = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 1;

    // G-zoom fades IN over the first 10 % of scroll; tagline fades OUT in sync.
    const fadeProgress = Math.min(1, raw * 10);
    gZoom.style.opacity = String(fadeProgress);
    if (tagline) tagline.style.opacity = String(1 - fadeProgress);

    if (raw <= 0) return;

    // Exponential growth: minSize (0.34× vw) → maxSize (17× vw)
    // Exponent uses quadratic ease-in (t²) — slow start, explosive finish —
    // matching gene.com's observed mask-size progression.
    const minSize = vw * 0.34;
    const maxSize = vw * 17;
    const maskSize = minSize * (maxSize / minSize) ** (raw * raw);

    // G visual center in the 512×512 canvas sits at roughly (50 %, 57 %)
    // of the canvas dimensions. Anchor the mask so that point stays at
    // (50 % vw, 52 % vh) on screen.
    const posX = vw * 0.50 - maskSize * 0.50;
    const posY = vh * 0.52 - maskSize * 0.57;

    const sizePx = `${maskSize}px ${maskSize}px`;
    const posPx = `${posX}px ${posY}px`;
    gZoom.style.webkitMaskSize = sizePx;
    gZoom.style.maskSize = sizePx;
    gZoom.style.webkitMaskPosition = posPx;
    gZoom.style.maskPosition = posPx;
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

  // Get the highest-resolution desktop source for the G-zoom background
  let hiResSrc = imgSrc;
  const desktopSrc = block.querySelector('picture source[media*="600px"]');
  if (desktopSrc) {
    const srcset = desktopSrc.getAttribute('srcset');
    const entry = srcset?.split(',')[0]?.trim()?.split(' ')[0];
    if (entry) {
      const resolver = document.createElement('a');
      resolver.href = entry;
      hiResSrc = resolver.href;
    }
  }

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

  // Layer 2: G-zoom illustration panel (sits on top via DOM order)
  const gZoom = document.createElement('div');
  gZoom.className = 'hero-g-zoom';
  gZoom.style.backgroundImage = `url('${hiResSrc}')`;
  block.append(gZoom);

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
  initGZoom(scrollPin, gZoom, taglineEl);
}
