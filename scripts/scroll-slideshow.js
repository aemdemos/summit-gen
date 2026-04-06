/**
 * Scroll-driven slideshow system — ports gene.com StoryApp "scrolling_slideshow" behavior.
 *
 * Architecture:
 *   - Vertical stack of full-bleed "slides" (sections) inside a container.
 *   - One IntersectionObserver with 101 thresholds watches all slides.
 *   - Each observation computes a normalized progress value [0, 1].
 *   - Per-slide hooks: onEnter(direction), onProgress(progress, direction), onExit(direction).
 *   - Slide types register hooks to drive CSS transitions / transforms.
 *
 * Usage:
 *   import { initScrollSlideshow } from './scroll-slideshow.js';
 *   initScrollSlideshow(containerEl, slideEls, {
 *     onEnter(index, direction) { ... },
 *     onProgress(index, progress, direction) { ... },
 *     onExit(index, direction) { ... },
 *   });
 *
 * No runtime dependencies.
 */

const THRESHOLD_COUNT = 51; // 0, 0.02, 0.04, …, 1.0

/** Build dense threshold array. */
function buildThresholds() {
  const t = [];
  for (let i = 0; i <= THRESHOLD_COUNT - 1; i += 1) {
    t.push(i / (THRESHOLD_COUNT - 1));
  }
  return t;
}

/** Clamp value between min and max. */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Compute normalized scroll progress for a slide.
 *
 * progress = 0  → slide top is at viewport bottom (just entering)
 * progress = 1  → slide bottom is at viewport top (just exiting)
 *
 * @param {DOMRect} rect  boundingClientRect of the slide
 * @param {number}  vh    viewport height (window.innerHeight)
 * @returns {number} progress in [0, 1]
 */
function computeProgress(rect, vh) {
  const y = vh - rect.top;
  const total = rect.height + vh;
  return total > 0 ? clamp(y / total, 0, 1) : 0;
}

/**
 * Initialize scroll-driven slideshow observation on a set of slide elements.
 *
 * @param {HTMLElement}   container  wrapper element (not required for observer, used for context)
 * @param {HTMLElement[]} slides     array of slide elements to observe
 * @param {object}        hooks      callback hooks
 * @param {function}      [hooks.onEnter]    (index, direction) => void
 * @param {function}      [hooks.onProgress] (index, progress, direction) => void
 * @param {function}      [hooks.onExit]     (index, direction) => void
 * @returns {{ destroy: function }} cleanup handle
 */
export function initScrollSlideshow(container, slides, hooks = {}) {
  if (!slides.length) return { destroy() {} };

  // Assign data-slide-index to each slide
  slides.forEach((slide, i) => {
    slide.dataset.slideIndex = String(i);
  });

  let prevScrollY = window.pageYOffset;
  const enteredSet = new Set();
  let ticking = false;

  /** Get scroll direction. */
  function getDirection() {
    const current = window.pageYOffset;
    const dir = current > prevScrollY ? 'down' : current < prevScrollY ? 'up' : 'none';
    prevScrollY = current;
    return dir;
  }

  /** Observer callback. */
  function handleIntersect(entries) {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const direction = getDirection();
      const vh = window.innerHeight;

      entries.forEach((entry) => {
        const idx = parseInt(entry.target.dataset.slideIndex, 10);
        const progress = computeProgress(entry.boundingClientRect, vh);

        // Enter / exit tracking
        if (entry.isIntersecting) {
          if (!enteredSet.has(idx)) {
            enteredSet.add(idx);
            if (hooks.onEnter) hooks.onEnter(idx, direction);
          }
          if (hooks.onProgress) hooks.onProgress(idx, progress, direction);
        } else if (enteredSet.has(idx)) {
          enteredSet.delete(idx);
          if (hooks.onExit) hooks.onExit(idx, direction);
        }
      });

      ticking = false;
    });
  }

  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver(handleIntersect, {
    root: null,
    threshold: prefersReducedMotion ? [0, 1] : buildThresholds(),
  });

  slides.forEach((slide) => observer.observe(slide));

  return {
    destroy() {
      observer.disconnect();
    },
  };
}

/**
 * Apply a standard "slide-up entrance" animation to a section based on scroll progress.
 *
 * progress < enterStart  → hidden below (translateY + opacity 0)
 * enterStart ≤ progress ≤ enterEnd → animating in
 * progress > enterEnd → fully visible
 *
 * @param {HTMLElement} el         element to animate
 * @param {number}      progress   [0, 1] from observer
 * @param {object}      [opts]     options
 * @param {number}      [opts.enterStart=0.1]  progress value where animation begins
 * @param {number}      [opts.enterEnd=0.35]   progress value where animation completes
 * @param {number}      [opts.translateY=60]   starting translateY offset in px
 */
export function applySlideEntrance(el, progress, opts = {}) {
  const { enterStart = 0.1, enterEnd = 0.35, translateY = 60 } = opts;

  if (progress < enterStart) {
    el.style.opacity = '0';
    el.style.transform = `translateY(${translateY}px)`;
  } else if (progress >= enterEnd) {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  } else {
    const t = (progress - enterStart) / (enterEnd - enterStart);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out
    el.style.opacity = String(ease);
    el.style.transform = `translateY(${translateY * (1 - ease)}px)`;
  }
}
