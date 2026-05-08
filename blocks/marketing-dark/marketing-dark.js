export default async function decorate(block) {
  const rows = [...block.children];
  // First row: icon + text content
  // Second row: background image
  // Structure is already correct for CSS-only layout
  // Just ensure proper semantic structure
  if (rows.length >= 2) {
    rows[0].classList.add('marketing-dark-content');
    rows[1].classList.add('marketing-dark-image');
  }
}
