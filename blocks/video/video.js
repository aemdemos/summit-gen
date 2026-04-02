/*
 * Video Block
 * Two-row layout: Row 1 = video source link, Row 2 = text overlay content.
 * Renders a full-viewport background video with centered text on top.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getVideoElement(source) {
  const video = document.createElement('video');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.muted = true;

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  return video;
}

export default async function decorate(block) {
  // EDS wraps block rows inside a single <div>; get the actual row cells
  const wrapper = block.children[0];
  const cells = wrapper ? [...wrapper.children] : [...block.children];
  if (cells.length < 2) return;

  // Cell 1: video source link
  const videoLink = cells[0].querySelector('a')?.href;

  // Cell 2: text overlay (heading, description, CTA)
  const overlayContent = cells[1];

  // Clear block and rebuild
  block.textContent = '';

  // Background video
  if (videoLink) {
    const video = getVideoElement(videoLink);
    video.className = 'video-bg';
    block.append(video);

    // Autoplay when visible (unless reduced motion)
    if (!prefersReducedMotion.matches) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          video.play().catch(() => {});
        }
      });
      observer.observe(block);
    }
  }

  // Text overlay
  const overlay = document.createElement('div');
  overlay.className = 'video-overlay';
  [...overlayContent.childNodes].forEach((child) => overlay.append(child.cloneNode(true)));
  block.append(overlay);
}
