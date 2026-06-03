import { type Indexable } from '$lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isIndexable(value: unknown): value is Indexable {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function flatIndex(root: Indexable): Indexable {
  const flat: Indexable = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getLeaves(children: any, path: string[] = []) {
    Object.entries(children).forEach(([key, value]) => {
      const currentPath = [...path, key];
      if (isIndexable(value)) {
        getLeaves(value, currentPath);
      } else {
        flat[currentPath.join('.')] = value;
      }
    });
  }
  getLeaves(root);

  return flat;
}
