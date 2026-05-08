export default function decorate(block) {
  const rows = [...block.children];
  block.innerHTML = '';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const iconCell = cells[0];
    const contentCell = cells[1];

    // First row = home logo link
    if (i === 0) {
      const link = iconCell.querySelector('a');
      const img = iconCell.querySelector('img');
      const homeItem = document.createElement('div');
      homeItem.className = 'sidebar-nav-home';
      if (link && img) {
        link.innerHTML = '';
        link.appendChild(img);
        homeItem.appendChild(link);
      } else if (img) {
        homeItem.appendChild(img);
      }
      block.appendChild(homeItem);
      return;
    }

    const item = document.createElement('div');
    item.className = 'sidebar-nav-item';

    const icon = iconCell?.querySelector('img');
    const label = contentCell?.querySelector('p')?.childNodes[0]?.textContent?.trim();
    const subList = contentCell?.querySelector('ul');
    const directLink = contentCell?.querySelector('p > a');

    if (directLink && !subList) {
      // Simple link — wrap whole item in anchor
      const a = document.createElement('a');
      a.href = directLink.href;
      if (icon) a.appendChild(icon);
      if (label) {
        const labelEl = document.createElement('span');
        labelEl.className = 'sidebar-nav-label';
        labelEl.textContent = label;
        a.appendChild(labelEl);
      }
      item.appendChild(a);
    } else {
      // Has flyout submenu
      if (icon) item.appendChild(icon);
      if (label) {
        const labelEl = document.createElement('span');
        labelEl.className = 'sidebar-nav-label';
        labelEl.textContent = label;
        item.appendChild(labelEl);
      }

      if (subList) {
        const flyout = document.createElement('div');
        flyout.className = 'sidebar-nav-flyout';
        if (label) {
          const title = document.createElement('div');
          title.className = 'sidebar-nav-flyout-title';
          title.textContent = label;
          flyout.appendChild(title);
        }
        flyout.appendChild(subList);
        item.appendChild(flyout);
      }

      item.setAttribute('tabindex', '0');
    }

    block.appendChild(item);
  });

  // Detach from EDS section wrapper and render as a fixed body-level element.
  // Use a small timeout to let EDS finish its block lifecycle before we move the node.
  setTimeout(() => {
    // Hide the EDS section wrapper that contains this block
    const section = block.closest('.section');
    if (section) section.style.cssText = 'display:none!important;margin:0;padding:0;height:0;overflow:hidden;';
    // Apply the sidebar styles directly and move to body
    block.style.cssText = 'position:fixed;top:0;left:0;width:80px;height:100vh;background:rgb(29,37,44);display:flex;flex-direction:column;align-items:center;z-index:200;overflow:visible;padding-top:8px;';
    document.body.appendChild(block);
    document.body.style.paddingLeft = '80px';
  }, 0);
}
