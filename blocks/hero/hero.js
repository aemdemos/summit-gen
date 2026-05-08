export default async function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  const row = rows[0];
  const cells = [...row.children];

  // First cell: image (background)
  // Second cell: text content
  // The CSS handles all positioning via absolute positioning of the image cell
  // and relative positioning of the text cell.

  // Ensure image cell has proper structure
  if (cells[0]) {
    const img = cells[0].querySelector('img');
    if (img) {
      img.setAttribute('loading', 'eager');
    }
  }
}
