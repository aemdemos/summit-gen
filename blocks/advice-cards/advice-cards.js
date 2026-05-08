export default async function decorate(block) {
  // The block has 4 rows (one per card). We restructure into a single
  // container div with all 4 cells for a 2x2 grid layout.
  const rows = [...block.children];
  const container = document.createElement('div');
  rows.forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      container.appendChild(cell);
    });
    row.remove();
  });
  block.appendChild(container);
}
