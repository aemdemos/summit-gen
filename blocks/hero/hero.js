/**
 * Hero block — supports:
 *   - Default: SVG text mask with illustration image + scroll parallax
 *   - Video variant: background video with text overlay
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  // Video variant: convert mp4 link to <video>
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

  // Default variant: SVG text mask with illustration
  const img = block.querySelector('img');
  const h1 = block.querySelector('h1');

  if (!img || !h1) return;

  const imgSrc = img.currentSrc || img.src;
  const wordmarkText = h1.textContent.trim();

  // Tagline is the <p> sibling AFTER the h1, not the one containing the picture
  let taglineText = '';
  let el = h1.nextElementSibling;
  while (el) {
    if (el.tagName === 'P' && !el.querySelector('picture, img')) {
      taglineText = el.textContent.trim();
      break;
    }
    el = el.nextElementSibling;
  }

  // Clear the block and rebuild with SVG mask approach
  block.textContent = '';

  // Create the hero content wrapper
  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';

  // Build SVG with text mask — the illustration shows through the text
  // eslint-disable-next-line browser-security/no-http-urls, browser-security/detect-mixed-content
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'hero-wordmark');
  svg.setAttribute('viewBox', '-50 0 2100 450');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Define clip path using text
  const defs = document.createElementNS(svgNS, 'defs');
  const clipPath = document.createElementNS(svgNS, 'clipPath');
  clipPath.setAttribute('id', 'hero-text-clip');

  const textEl = document.createElementNS(svgNS, 'text');
  textEl.setAttribute('x', '1000');
  textEl.setAttribute('y', '320');
  textEl.setAttribute('text-anchor', 'middle');
  textEl.setAttribute('font-family', 'Gene-Condensed-Bold, Arial Black, sans-serif');
  textEl.setAttribute('font-size', '380');
  textEl.setAttribute('font-weight', '700');
  textEl.textContent = wordmarkText;
  clipPath.append(textEl);
  defs.append(clipPath);
  svg.append(defs);

  // Black text (full wordmark) — solid black base layer
  const blackText = document.createElementNS(svgNS, 'text');
  blackText.setAttribute('x', '1000');
  blackText.setAttribute('y', '320');
  blackText.setAttribute('text-anchor', 'middle');
  blackText.setAttribute('font-family', 'Gene-Condensed-Bold, Arial Black, sans-serif');
  blackText.setAttribute('font-size', '380');
  blackText.setAttribute('font-weight', '700');
  blackText.setAttribute('fill', 'black');
  blackText.textContent = wordmarkText;
  svg.append(blackText);

  // Image clipped to text shape — overlays the left ~50% of the text
  const imgEl = document.createElementNS(svgNS, 'image');
  imgEl.setAttribute('href', imgSrc);
  imgEl.setAttribute('x', '0');
  imgEl.setAttribute('y', '-50');
  imgEl.setAttribute('width', '1000');
  imgEl.setAttribute('height', '550');
  imgEl.setAttribute('preserveAspectRatio', 'xMinYMid slice');
  imgEl.setAttribute('clip-path', 'url(#hero-text-clip)');
  imgEl.setAttribute('class', 'hero-mask-image');
  svg.append(imgEl);

  heroContent.append(svg);

  // Tagline text below
  if (taglineText) {
    const tagline = document.createElement('p');
    tagline.className = 'hero-tagline';
    tagline.textContent = taglineText;
    heroContent.append(tagline);
  }

  block.append(heroContent);

  // Update image src when high-res loads
  img.addEventListener('load', () => {
    const newSrc = img.currentSrc || img.src;
    imgEl.setAttribute('href', newSrc);
  });

  // Scroll-based parallax: shift the mask image position as user scrolls
  const onScroll = () => {
    const rect = block.getBoundingClientRect();
    const scrollProgress = Math.max(0, -rect.top / (rect.height * 0.3));
    const clamped = Math.min(1, scrollProgress);
    // Move the image from left (x=0) to right (x=900) as scroll progresses
    const xShift = clamped * 1000;
    imgEl.setAttribute('x', `${xShift}`);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}
