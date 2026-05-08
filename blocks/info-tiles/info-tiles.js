export default async function decorate(block) {
  // Each row has a single cell with h2 + p content.
  // Flatten: unwrap the inner cell div so content sits directly in the row.
  const rows = [...block.children];
  rows.forEach((row) => {
    const cell = row.children[0];
    if (cell) {
      while (cell.firstChild) {
        row.appendChild(cell.firstChild);
      }
      cell.remove();
    }
  });
}
