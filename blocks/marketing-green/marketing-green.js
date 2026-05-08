export default async function decorate(block) {
  // Block structure: row with 3 cells - icon, text content, background image
  // No restructuring needed - CSS handles the layout
  const rows = [...block.children];
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 3) {
      cells[0].classList.add('marketing-green-icon');
      cells[1].classList.add('marketing-green-content');
      cells[2].classList.add('marketing-green-image');
    }
  });
}
