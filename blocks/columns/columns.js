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

  // "50" mask effect: in warm-gray section, overlay the illustration through the "50" image shape
  const section = block.closest('.section');
  if (section && section.classList.contains('warm-gray')) {
    const imgCol = block.querySelector('.columns-img-col');
    const img = imgCol?.querySelector('img');
    if (imgCol && img) {
      // Hide the original image (it's a flat PNG) and add the mask overlay
      img.style.opacity = '0';
      const maskDiv = document.createElement('div');
      maskDiv.className = 'columns-50-mask';
      imgCol.style.position = 'relative';
      imgCol.append(maskDiv);
    }
  }
}
