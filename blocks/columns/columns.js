import { getBlockId } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockId = getBlockId('columns');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `columns-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Columns');

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
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

  // "50" mask effect: in warm-gray section, use the authored image as
  // a CSS mask-image so the illustration background shows through its shape.
  // Both the mask PNG and the illustration background come from DA content.
  const section = block.closest('.section');
  if (section && section.classList.contains('warm-gray')) {
    const imgCol = block.querySelector('.columns-img-col');
    const img = imgCol?.querySelector('img');
    if (imgCol && img) {
      const maskSrc = img.currentSrc || img.src;
      img.style.opacity = '0';

      const maskDiv = document.createElement('div');
      maskDiv.className = 'columns-50-mask';
      // Use the authored "50" image as the mask shape
      maskDiv.style.maskImage = `url('${maskSrc}')`;
      maskDiv.style.webkitMaskImage = `url('${maskSrc}')`;

      // Use the hero illustration as the background visible through the mask.
      // Read it from the hero block's authored image if available.
      const heroImg = document.querySelector('.hero img, .hero picture source');
      const heroBgSrc = heroImg?.srcset?.split(',')[0]?.trim()?.split(' ')[0]
        || heroImg?.currentSrc || heroImg?.src || '';
      if (heroBgSrc) {
        maskDiv.style.backgroundImage = `url('${heroBgSrc}')`;
        maskDiv.style.backgroundSize = 'cover';
        maskDiv.style.backgroundPosition = 'center';
      }

      imgCol.append(maskDiv);
    }
  }
}
