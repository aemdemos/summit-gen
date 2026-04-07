/**
 * Hero block — ports gene.com homepage gene-animation (StoryApp M0 + StoryApp CSS).
 *
 * Source parity:
 *   - DOM / class names: StoryApp-URji_XlK.css (`.gene-animation`, `.gene-mask`, `.g-mask`, …)
 *   - Mask layout + scroll math: StoryApp-CgR3EhWF.js `M0` (`T`, `E`, `S`, `z`, GSAP timeline)
 *   - Wordmark SVG: same paths as production (viewBox 0 0 3538 465, `#Gene` opacity 0,
 *     `#ntech` solid black) — `icons/gene-animation-wordmark.svg`
 *
 * `HomepageTakeover-BCXbPkJp.js` only composes the page; the animation lives in StoryApp.
 *
 * No runtime deps (no GSAP): scroll progress drives the same `mask-size` / `mask-position` /
 * `transform` updates as the original `onUpdate` (`z()`).
 *
 * @param {Element} block The hero block element
 */

/** Design width of the animation wordmark SVG (StoryApp). */
const W = 3538;
/** Fallback gene-mask width when `#Gene` is not measurable (StoryApp `N`). */
const N = 1655.66;
/** Left edge of `#ntech` “n” in wordmark user space (`icons/gene-animation-wordmark.svg`). */
const NTECH_LEFT_REF = 1723.83;
/** Ignore `getBBox()` when width below this (e.g. `opacity="0"` yields zeros in some engines). */
const MIN_GENE_BBOX_W = 400;
/** Scroll helpers (StoryApp). */
const B_CONST = 218;
const C_CONST = 56;
/** `raw` scroll 0…1 maps to timeline `t` 0…SCROLL_T_MAX (StoryApp 1.6). */
const SCROLL_T_MAX = 1.6;
/** No mask motion, no wordmark transform change; full wordmark + tagline visible (tune vs --hero-scroll-height). */
const HERO_SCROLL_HOLD_T = 0.3;
/** After hold, tagline fades out over this span before ntech / mask animation (was first 0.1 of old t). */
const HERO_TAGLINE_FADE_T = 0.1;

/** @param {boolean} portrait */
function portraitMult(portrait) {
  return portrait ? 8 : 3;
}

/**
 * StoryApp `T()` — mask size / position from `#Gene` getBBox + layout.
 * @param {HTMLElement|null} wordmarkEl `.wordmark`
 * @param {HTMLElement|null} maskLayerEl `.gene-mask` (full-bleed layer; offsetWidth ≈ viewport)
 * @param {SVGSVGElement|null} svgEl
 * @returns {{ maskSize: string, maskPosition: string, webkitMaskSize: string, webkitMaskPosition: string, maskPositionY: number, baseSizePx: number, baseLeftPx: number }}
 */
function computeMaskLayout(wordmarkEl, maskLayerEl, svgEl) {
  if (!wordmarkEl || !maskLayerEl) {
    const pct = (N / W) * 100;
    const off = ((1 - N / W) / 2) * 100;
    return {
      maskSize: `${pct}%`,
      maskPosition: `${off}% 50%`,
      webkitMaskSize: `${pct}%`,
      webkitMaskPosition: `${off}% 50%`,
      maskPositionY: window.innerHeight / 2,
      baseSizePx: 0,
      baseLeftPx: 0,
    };
  }

  const wordmarkWidth = wordmarkEl.offsetWidth;
  /* Gene sits on the left of the wordmark SVG; `(W - N) / 2` was wrong and skewed mask vs letters. */
  let geneW = N;
  let geneX = 0;
  const geneG = svgEl && svgEl.querySelector('#Gene');
  if (geneG) {
    try {
      const box = geneG.getBBox();
      if (box.width >= MIN_GENE_BBOX_W && Number.isFinite(box.x)) {
        geneW = box.width;
        geneX = box.x;
      }
    } catch {
      /* keep N, 0 */
    }
  }
  const yScale = wordmarkWidth / W;
  const L = geneW * yScale;
  const maskLayerRect = maskLayerEl.getBoundingClientRect();
  const wmRect = wordmarkEl.getBoundingClientRect();
  /* StoryApp T() uses (viewport - wordmarkWidth) / 2 — only valid if the wordmark is
   * horizontally centered. Our DOM matches gene.com: .mask-background flex-grow pushes
   * the wordmark to the right, so we must anchor the mask to the wordmark’s real left
   * edge; otherwise mask-position is wrong and “Gene” (opacity 0) shows empty beige. */
  const q = (wmRect.left - maskLayerRect.left) + (geneX * yScale);
  const Y = wmRect.top - maskLayerRect.top;

  return {
    maskSize: `${L}px auto`,
    maskPosition: `${q}px ${Y}px`,
    webkitMaskSize: `${L}px auto`,
    webkitMaskPosition: `${q}px ${Y}px`,
    maskPositionY: Y,
    baseSizePx: L,
    baseLeftPx: q,
  };
}

/**
 * StoryApp `E(O, D)`.
 * @param {number} O — scaled mask size (numerator in `O/B` term)
 * @param {number} D — `B_CONST` or `C_CONST`
 */
function computeLeftPos(maskOuterW, wordmarkWidth, O, D) {
  const R = maskOuterW / 2;
  const z = wordmarkWidth / W;
  const L = D * z;
  const B = N * z;
  const q = O / B;
  return R - L * q;
}

/**
 * StoryApp `S(O, D)`. Uses actual wordmark offset from mask layer (not (M−V)/2) so
 * it stays correct with `.mask-background` flex-grow (wordmark sits on the right).
 */
function computeWordmarkTx(maskOuterW, wordmarkWidth, wordmarkLeft, O, D) {
  const R = maskOuterW / 2;
  const z = wordmarkWidth / W;
  const L = D * z;
  return R - wordmarkLeft - L * O;
}

/** Apply StoryApp `z()` — same styles to `.gene-mask` and `.g-mask`, transform `.wordmark`. */
function applyMaskFrame(geneMask, gMask, wordmark, state) {
  const { size, leftPos, topPos, wmScale, wmTx } = state;
  const sizeStr = `${size}px auto`;
  const posStr = `${leftPos}px ${topPos}px`;
  [geneMask, gMask].forEach((el) => {
    if (!el) return;
    el.style.maskSize = sizeStr;
    el.style.webkitMaskSize = sizeStr;
    el.style.maskPosition = posStr;
    el.style.webkitMaskPosition = posStr;
  });
  if (wordmark) {
    wordmark.style.transform = `translateX(${wmTx}px) scale(${wmScale})`;
  }
}

/**
 * Align solid `#ntech` to masked `#Gene`. `auto` uses bbox when reliable; otherwise art fallbacks.
 * @param {Element} block `.hero.gene-animation`
 * @param {SVGGElement|null} ntechGroup `.hero-ntech`
 * @param {SVGSVGElement|null} svgEl
 */
function applyNtechShift(block, ntechGroup, svgEl) {
  if (!ntechGroup || !svgEl) return;
  const cs = getComputedStyle(block);
  const rawShift = cs.getPropertyValue('--hero-ntech-shift-u').trim();
  const rawKern = cs.getPropertyValue('--hero-ntech-kern-u').trim();
  const kern = parseFloat(rawKern);
  const k = Number.isFinite(kern) ? kern : 0;

  ntechGroup.removeAttribute('transform');

  const nb = ntechGroup.getBBox();
  const ntechLeft = nb.width > 200 && Number.isFinite(nb.x) ? nb.x : NTECH_LEFT_REF;

  let geneRight = N;
  const gene = svgEl.querySelector('#Gene');
  if (gene) {
    try {
      const gb = gene.getBBox();
      if (gb.width >= MIN_GENE_BBOX_W && Number.isFinite(gb.x)) {
        geneRight = gb.x + gb.width;
      }
    } catch {
      /* keep N */
    }
  }

  let shift;
  if (rawShift === 'auto' || rawShift === '') {
    shift = geneRight - ntechLeft + k;
  } else {
    const u = parseFloat(rawShift);
    shift = Number.isFinite(u) ? u : geneRight - ntechLeft + k;
  }

  /* Catastrophic bbox bugs produced ~−1700; upper clamp allows positive kern (gap) from CSS. */
  shift = Math.max(-20, Math.min(120, shift));

  if (shift !== 0) {
    ntechGroup.setAttribute('transform', `translate(${shift} 0)`);
  }
}

function lerp(a, b, u) {
  return a + (b - a) * u;
}

/**
 * Map scroll `raw` [0,1] to animation state: hold + tagline-only fade, then remapped `ta`.
 * First zoom segment runs mask + wordmark + ntech fade together (`ntechOpacity` tracks zoom `u`);
 * later segments continue StoryApp zoom with ntech gone and `.g-mask` on.
 * @param {number} raw
 * @param {{ baseSize: number, baseLeft: number, baseTop: number, maskOuterW: number, wordmarkW: number, wordmarkLeft: number, portrait: boolean }} base
 */
function scrollToState(raw, base) {
  const mult = portraitMult(base.portrait);
  const { baseSize, baseLeft, baseTop, maskOuterW, wordmarkW } = base;
  const t = raw * SCROLL_T_MAX;

  /** @type {{ size: number, leftPos: number, topPos: number, wmScale: number, wmTx: number, taglineOpacity: number, ntechOpacity: number, geneMaskOpacity: number, gMaskOpacity: number }} */
  const fallback = {
    size: 0,
    leftPos: 0,
    topPos: baseTop,
    wmScale: 1,
    wmTx: 0,
    taglineOpacity: 1,
    ntechOpacity: 1,
    geneMaskOpacity: 1,
    gMaskOpacity: 0,
  };
  if (baseSize <= 0 || wordmarkW <= 0) {
    if (t < HERO_SCROLL_HOLD_T) fallback.taglineOpacity = 1;
    else if (t < HERO_SCROLL_HOLD_T + HERO_TAGLINE_FADE_T) {
      const u = (t - HERO_SCROLL_HOLD_T) / HERO_TAGLINE_FADE_T;
      fallback.taglineOpacity = 1 - u;
    } else fallback.taglineOpacity = 0;
    return fallback;
  }

  const wl = base.wordmarkLeft;
  const tx0 = computeWordmarkTx(maskOuterW, wordmarkW, wl, 1, W / 2);
  const tx1 = computeWordmarkTx(maskOuterW, wordmarkW, wl, mult, B_CONST);
  const tx2 = computeWordmarkTx(maskOuterW, wordmarkW, wl, 25, C_CONST);
  const tx3 = computeWordmarkTx(maskOuterW, wordmarkW, wl, 50, C_CONST);

  const frozen = {
    size: baseSize,
    leftPos: baseLeft,
    topPos: baseTop,
    wmScale: 1,
    wmTx: tx0,
    taglineOpacity: 1,
    ntechOpacity: 1,
    geneMaskOpacity: 1,
    gMaskOpacity: 0,
  };

  if (t < HERO_SCROLL_HOLD_T) {
    return frozen;
  }
  if (t < HERO_SCROLL_HOLD_T + HERO_TAGLINE_FADE_T) {
    const u = (t - HERO_SCROLL_HOLD_T) / HERO_TAGLINE_FADE_T;
    return { ...frozen, taglineOpacity: 1 - u };
  }

  const spanAfter = SCROLL_T_MAX - HERO_SCROLL_HOLD_T - HERO_TAGLINE_FADE_T;
  const ta = 0.1 + Math.min(1, Math.max(0, (t - HERO_SCROLL_HOLD_T - HERO_TAGLINE_FADE_T) / spanAfter)) * (SCROLL_T_MAX - 0.1);

  const out = {
    size: baseSize,
    leftPos: baseLeft,
    topPos: baseTop,
    wmScale: 1,
    wmTx: tx0,
    taglineOpacity: 0,
    ntechOpacity: 1,
    geneMaskOpacity: 1,
    gMaskOpacity: 0,
  };

  /*
   * First zoom segment (StoryApp ta 0.1…0.6): drive mask + wordmark from the start of `ta`.
   * Previously ntech faded with an early return while zoom stayed at 0, then at ta=0.3 zoom
   * jumped to u=0.4 — now ntechOpacity tracks the same u so Gene+ntech zoom together and
   * ntech eases out as zoom progresses.
   */
  if (ta <= 0.6) {
    const u = Math.min(1, Math.max(0, (ta - 0.1) / 0.5));
    const endSize = baseSize * mult;
    const endLeft = computeLeftPos(maskOuterW, wordmarkW, baseSize * mult, B_CONST);
    out.size = lerp(baseSize, endSize, u);
    out.leftPos = lerp(baseLeft, endLeft, u);
    out.wmScale = lerp(1, mult, u);
    out.wmTx = lerp(tx0, tx1, u);

    out.ntechOpacity = 1 - u;

    /* Keep Gene illustration at full strength; only ntech fades here (CSS L→R mask softens “ene”). */
    out.geneMaskOpacity = 1;

    /* `.g-mask` ramps in only while ntech is nearly gone to limit double-mask on “G”. */
    out.gMaskOpacity = u < 0.8 ? 0 : (u - 0.8) / 0.2;

    return out;
  }

  out.ntechOpacity = 0;
  out.gMaskOpacity = 1;
  out.geneMaskOpacity = 0;

  if (ta <= 1.0) {
    const u = (ta - 0.6) / 0.4;
    const s0 = baseSize * mult;
    const s1 = baseSize * 25;
    const l0 = computeLeftPos(maskOuterW, wordmarkW, baseSize * mult, B_CONST);
    const l1 = computeLeftPos(maskOuterW, wordmarkW, baseSize * 25, C_CONST);
    out.size = lerp(s0, s1, u);
    out.leftPos = lerp(l0, l1, u);
    out.wmScale = lerp(mult, 25, u);
    out.wmTx = lerp(tx1, tx2, u);
    return out;
  }

  const u = (ta - 1.0) / 0.6;
  const s0 = baseSize * 25;
  const s1 = baseSize * 50;
  const l0 = computeLeftPos(maskOuterW, wordmarkW, baseSize * 25, C_CONST);
  const l1 = computeLeftPos(maskOuterW, wordmarkW, baseSize * 50, C_CONST);
  out.size = lerp(s0, s1, u);
  out.leftPos = lerp(l0, l1, u);
  out.wmScale = lerp(25, 50, u);
  out.wmTx = lerp(tx2, tx3, u);
  return out;
}

/** Cubic ease-in-out for entrance. */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Entrance: fade / reveal tagline (gene.com loads illustration before showing block).
 * @param {HTMLElement|null} taglineWrap
 * @param {number} durationMs
 */
function playEntrance(taglineWrap, durationMs) {
  if (!taglineWrap) return;
  const start = performance.now();
  function tick(now) {
    const raw = Math.min(1, (now - start) / durationMs);
    taglineWrap.style.opacity = String(easeInOut(raw));
    if (raw < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * @param {HTMLElement} scrollPin
 * @param {HTMLElement|null} geneMask
 * @param {HTMLElement|null} gMask
 * @param {HTMLElement|null} wordmark
 * @param {HTMLElement|null} taglineWrap
 * @param {HTMLElement|null} ntechGroup
 * @param {SVGSVGElement|null} svgEl
 * @param {Element|null} heroBlock `.hero.gene-animation` (ntech shift + CSS tokens)
 */
function initGeneScroll(scrollPin, geneMask, gMask, wordmark, taglineWrap, ntechGroup, svgEl, heroBlock) {
  let base = {
    baseSize: 0,
    baseLeft: 0,
    baseTop: 0,
    maskOuterW: window.innerWidth,
    wordmarkW: 0,
    wordmarkLeft: 0,
    portrait: window.matchMedia('(orientation: portrait)').matches,
  };

  function refreshBase() {
    if (!geneMask || !wordmark) return;
    const layout = computeMaskLayout(wordmark, geneMask, svgEl);
    const gr = geneMask.getBoundingClientRect();
    const wr = wordmark.getBoundingClientRect();
    base = {
      baseSize: layout.baseSizePx,
      baseLeft: layout.baseLeftPx,
      baseTop: layout.maskPositionY,
      maskOuterW: geneMask.offsetWidth,
      wordmarkW: wordmark.offsetWidth,
      wordmarkLeft: wr.left - gr.left,
      portrait: window.matchMedia('(orientation: portrait)').matches,
    };
    const initialTx = computeWordmarkTx(base.maskOuterW, base.wordmarkW, base.wordmarkLeft, 1, W / 2);
    applyMaskFrame(geneMask, gMask, wordmark, {
      size: base.baseSize,
      leftPos: base.baseLeft,
      topPos: base.baseTop,
      wmScale: 1,
      wmTx: initialTx,
    });
    if (heroBlock && ntechGroup) applyNtechShift(heroBlock, ntechGroup, svgEl);
  }

  function update() {
    const rect = scrollPin.getBoundingClientRect();
    const scrollable = scrollPin.offsetHeight - window.innerHeight;
    const raw = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0;
    const st = scrollToState(raw, base);

    if (taglineWrap) taglineWrap.style.opacity = String(st.taglineOpacity);
    if (ntechGroup) ntechGroup.style.opacity = String(st.ntechOpacity);
    if (geneMask) geneMask.style.opacity = String(st.geneMaskOpacity);
    if (gMask) gMask.style.opacity = String(st.gMaskOpacity);

    let { topPos } = st;
    try {
      if (wordmark && geneMask) {
        const gr = geneMask.getBoundingClientRect();
        const wr = wordmark.getBoundingClientRect();
        topPos = wr.top - gr.top;
      }
    } catch {
      /* keep st.topPos */
    }

    applyMaskFrame(geneMask, gMask, wordmark, {
      size: st.size,
      leftPos: st.leftPos,
      topPos,
      wmScale: st.wmScale,
      wmTx: st.wmTx,
    });
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    refreshBase();
    update();
  }, { passive: true });

  if (typeof ResizeObserver !== 'undefined' && wordmark) {
    const ro = new ResizeObserver(() => {
      refreshBase();
      update();
    });
    ro.observe(wordmark);
  }

  refreshBase();
  update();
}

/**
 * @param {string} codeBasePath e.g. '' or from aem
 */
async function loadWordmarkSvg(codeBasePath) {
  const url = `${codeBasePath}/icons/gene-animation-wordmark.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`wordmark fetch ${res.status}`);
  const text = await res.text();
  /* Same-origin static asset from /icons; no network XML entities. */
  /* eslint-disable-next-line secure-coding/no-xxe-injection -- same-origin static SVG, no DTD */
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) throw new Error('invalid wordmark svg');
  return document.importNode(svg, true);
}

export default async function decorate(block) {
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

  const img = block.querySelector('img');
  const h1 = block.querySelector('h1');
  if (!img || !h1) return;

  const wordmarkText = h1.textContent.trim();
  // Use highest-res local image (2850×1800) — DA caps at 2000px which is too low for the mask effect
  const imgSrc = '/images/hero/hero-desktop.jpg';

  let taglineText = '';
  let sibling = h1.nextElementSibling;
  while (sibling) {
    if (sibling.tagName === 'P' && !sibling.querySelector('picture, img')) {
      taglineText = sibling.textContent.trim();
      break;
    }
    sibling = sibling.nextElementSibling;
  }

  block.textContent = '';
  block.classList.add('gene-animation');

  const codeBasePath = window.hlx?.codeBasePath || '';

  const timeline = document.createElement('div');
  timeline.className = 'gene-animation-timeline';

  const maskContainer = document.createElement('div');
  maskContainer.className = 'gene-animation-mask-container';

  const geneMask = document.createElement('div');
  geneMask.className = 'gene-mask';
  geneMask.style.backgroundColor = '#ebe6e0';
  geneMask.style.backgroundImage = `url('${imgSrc}')`;

  const gMask = document.createElement('div');
  gMask.className = 'g-mask';
  gMask.style.backgroundColor = '#ebe6e0';
  gMask.style.backgroundImage = `url('${imgSrc}')`;

  const flexCenter = document.createElement('div');
  flexCenter.className = 'gene-animation-flex-center';

  const wordmarkWrapper = document.createElement('div');
  wordmarkWrapper.className = 'wordmark-wrapper';

  const maskBackground = document.createElement('div');
  maskBackground.className = 'mask-background';

  const wordmarkContainer = document.createElement('div');
  wordmarkContainer.className = 'wordmark-container';

  const wordmark = document.createElement('div');
  wordmark.className = 'wordmark';

  /** @type {SVGSVGElement|null} */
  let svgEl = null;
  try {
    await document.fonts.ready;
    svgEl = /** @type {SVGSVGElement} */ (await loadWordmarkSvg(codeBasePath));
    svgEl.removeAttribute('aria-hidden');
    svgEl.setAttribute('role', 'img');
    svgEl.setAttribute('aria-label', wordmarkText);
    wordmark.append(svgEl);
  } catch {
    const p = document.createElement('p');
    p.className = 'hero-fallback-wordmark';
    p.textContent = wordmarkText;
    wordmark.append(p);
  }

  const hiddenH1 = document.createElement('h1');
  hiddenH1.textContent = wordmarkText;
  hiddenH1.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
  wordmarkContainer.append(hiddenH1);
  wordmarkContainer.append(wordmark);

  const taglineWrap = document.createElement('div');
  taglineWrap.className = 'tagline-wrapper';
  taglineWrap.style.opacity = '0';
  const taglineInner = document.createElement('div');
  taglineInner.className = 'tagline-container';
  if (taglineText) {
    const p = document.createElement('p');
    p.className = 'hero-tagline gene-animation-tagline';
    p.textContent = taglineText;
    taglineInner.append(p);
  }
  taglineWrap.append(taglineInner);

  wordmarkWrapper.append(maskBackground);
  wordmarkWrapper.append(wordmarkContainer);
  wordmarkWrapper.append(taglineWrap);

  flexCenter.append(wordmarkWrapper);
  maskContainer.append(geneMask);
  maskContainer.append(gMask);
  maskContainer.append(flexCenter);
  timeline.append(maskContainer);
  block.append(timeline);

  const section = block.closest('.section');
  const scrollPin = document.createElement('div');
  scrollPin.className = 'hero-scroll-pin';
  section.parentNode.insertBefore(scrollPin, section);
  scrollPin.append(section);
  section.classList.add('hero-pinned');

  const ntechGroup = svgEl ? svgEl.querySelector('.hero-ntech') : null;

  await new Promise((r) => {
    requestAnimationFrame(() => requestAnimationFrame(r));
  });

  playEntrance(taglineWrap, 1500);
  initGeneScroll(scrollPin, geneMask, gMask, wordmark, taglineWrap, ntechGroup, svgEl, block);
}
