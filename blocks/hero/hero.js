/**
 * Hero block — supports:
 *   - Default: image-fill text (background-clip: text + scroll parallax)
 *   - Video variant: background video with text overlay
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const rows = [...block.children];

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

  // Default variant: image-fill text effect
  const img = block.querySelector('img');
  const h1 = block.querySelector('h1');

  if (img && h1) {
    const applyBg = (src, posX) => {
      // Composite background: illustration left + solid black right
      h1.style.background = `linear-gradient(to right, transparent 0%, transparent 50%, #000 50%, #000 100%), url('${src}') ${posX}% center / 50% auto no-repeat`;
      h1.style.webkitBackgroundClip = 'text';
      h1.style.backgroundClip = 'text';
    };

    let currentSrc = img.currentSrc || img.src;
    applyBg(currentSrc, 0);

    // When the high-res image loads via <picture> srcset, update
    img.addEventListener('load', () => {
      const newSrc = img.currentSrc || img.src;
      if (newSrc !== currentSrc) {
        currentSrc = newSrc;
        applyBg(currentSrc, 0);
      }
    });

    // Scroll-based parallax: shift the illustration through the text
    const onScroll = () => {
      const rect = block.getBoundingClientRect();
      const scrollProgress = -rect.top / (rect.height || 1);
      const shift = Math.max(0, Math.min(1, scrollProgress)) * 40;
      applyBg(currentSrc, shift);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Label rows — if a row has both picture and h1, it's a combined row
  rows.forEach((row) => {
    const pic = row.querySelector('picture');
    const heading = row.querySelector('h1');
    if (pic && heading) {
      pic.style.display = 'none';
      row.classList.add('hero-text');
    } else if (pic) {
      row.classList.add('hero-media');
    } else {
      row.classList.add('hero-text');
    }
  });
}
