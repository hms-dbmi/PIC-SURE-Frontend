export type SortableOptions<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (newItems: T[]) => void;
  axis?: 'y' | 'x';
  itemSelector?: string; // optional override
};

/**
 * Svelte action to make a container sortable via HTML5 drag-and-drop.
 * Items are identified by either data-id or id attribute.
 */
export function sortable<T>(node: HTMLElement, options: SortableOptions<T>) {
  let opts = options;

  const itemRootSelector = () => opts.itemSelector || '.sortable-item, [data-id], [id]';

  function getItemElements(): HTMLElement[] {
    return Array.from(node.children).filter((el): el is HTMLElement =>
      (el as HTMLElement).matches(itemRootSelector()),
    ) as HTMLElement[];
  }

  function refreshDraggables() {
    const draggables = getItemElements();
    for (const el of draggables) el.setAttribute('draggable', 'true');
  }

  function handleDragStart(e: DragEvent) {
    const el = (e.target as HTMLElement)?.closest(itemRootSelector()) as HTMLElement | null;
    if (!el) return;
    e.stopPropagation();
    const id = (el.dataset && el.dataset.id) || el.id || '';
    e.dataTransfer?.setData('text/plain', id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    el.classList.add('dragging');
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    const dragging = node.querySelector<HTMLElement>(':scope > .dragging');
    if (!dragging) return;
    const items = getItemElements().filter((el) => el !== dragging);
    const after = getAfterElementFromSiblings(
      items,
      opts.axis === 'x' ? e.clientX : e.clientY,
      opts.axis === 'x' ? 'x' : 'y',
    );
    if (!after) node.appendChild(dragging);
    else if (after.parentElement === node) node.insertBefore(dragging, after);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const orderIds = getItemElements().map((el) => getElementId(el)).filter((id) => id);
    const newItems = orderIds
      .map((id) => opts.items.find((i) => opts.getId(i) === id))
      .filter(Boolean) as T[];
    opts.onReorder(newItems);
    node.querySelector(':scope > .dragging')?.classList.remove('dragging');
  }

  function handleDragEnd() {
    node.querySelector(':scope > .dragging')?.classList.remove('dragging');
  }

  node.addEventListener('dragstart', handleDragStart);
  node.addEventListener('dragover', handleDragOver);
  node.addEventListener('drop', handleDrop);
  node.addEventListener('dragend', handleDragEnd);

  refreshDraggables();

  return {
    update(newOpts: SortableOptions<T>) {
      opts = newOpts;
      refreshDraggables();
    },
    destroy() {
      node.removeEventListener('dragstart', handleDragStart);
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('drop', handleDrop);
      node.removeEventListener('dragend', handleDragEnd);
    },
  };
}

function getAfterElementFromSiblings(
  siblings: HTMLElement[],
  pos: number,
  axis: 'x' | 'y',
) {
  return siblings.reduce<{ offset: number; element: HTMLElement | null }>(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const mid = axis === 'y' ? box.top + box.height / 2 : box.left + box.width / 2;
      const offset = pos - mid;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null },
  ).element;
}

function getElementId(el: HTMLElement): string {
  const direct = (el.dataset && el.dataset.id) || el.id;
  if (direct) return direct;
  const nestedData = el.querySelector<HTMLElement>('[data-id]')?.dataset.id;
  if (nestedData) return nestedData;
  const nestedId = el.querySelector<HTMLElement>('[id]')?.id;
  return nestedId || '';
}


