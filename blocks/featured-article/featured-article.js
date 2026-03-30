/**
 * Featured Article block — side-by-side text + image layout.
 * @param {Element} block The featured-article block element
 */
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cols = [...row.children];
  cols.forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic) {
      col.classList.add('featured-article-image');
    } else {
      col.classList.add('featured-article-text');
    }
  });
}
