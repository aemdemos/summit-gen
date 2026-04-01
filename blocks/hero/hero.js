/**
 * Hero block — supports default (image-fill text) and video variants.
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
    // Use the image as background-image for the text-clip effect
    h1.style.backgroundImage = `url('${img.currentSrc || img.src}')`;
  }

  // Label rows
  rows.forEach((row) => {
    const pic = row.querySelector('picture');
    if (pic) {
      row.classList.add('hero-media');
    } else {
      row.classList.add('hero-text');
    }
  });
}
