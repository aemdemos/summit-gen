export default async function decorate(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    const cells = [...row.children];
    // First cell is image, second is content - structure is already correct
    // Add semantic class for styling hooks
    if (cells[0]) cells[0].classList.add('article-cards-image');
    if (cells[1]) cells[1].classList.add('article-cards-content');
  });
}
