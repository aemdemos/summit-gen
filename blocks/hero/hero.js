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
    // Use the illustration image as background for the text-clip effect
    const imgSrc = img.currentSrc || img.src;
    h1.style.backgroundImage = `url('${imgSrc}')`;

    // When the high-res image loads via <picture> srcset, update the background
    img.addEventListener('load', () => {
      const newSrc = img.currentSrc || img.src;
      if (newSrc !== imgSrc) {
        h1.style.backgroundImage = `url('${newSrc}')`;
      }
    });

    // Scroll-based parallax: shift the background-position as user scrolls
    // This moves the illustration through the text mask
    const onScroll = () => {
      const rect = block.getBoundingClientRect();
      const scrollProgress = -rect.top / (rect.height || 1);
      // Shift background horizontally by up to 30% as user scrolls past
      const shift = Math.max(0, Math.min(1, scrollProgress)) * 30;
      h1.style.backgroundPosition = `${shift}% center`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Label rows — if a row has both picture and h1, it's a combined row
  rows.forEach((row) => {
    const pic = row.querySelector('picture');
    const heading = row.querySelector('h1');
    if (pic && heading) {
      // Combined row: hide picture, show text
      pic.style.display = 'none';
      row.classList.add('hero-text');
    } else if (pic) {
      row.classList.add('hero-media');
    } else {
      row.classList.add('hero-text');
    }
  });
}
