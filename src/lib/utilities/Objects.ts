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

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
}

/**
 * Deep merges B onto A. A provides defaults; any key present (and not
 * undefined) in B overrides A. Arrays in B fully replace arrays in A
 * (no element-wise merging). Nested plain objects are merged recursively.
 */
export function deepMerge<T extends PlainObject>(a: T, b: unknown): T {
  if (!isPlainObject(b)) {
    return a;
  }

  const result: PlainObject = { ...a };

  for (const key of Object.keys(b)) {
    const bValue = b[key];
    const aValue = result[key];

    if (bValue === undefined) {
      // B explicitly has `undefined` -> keep A's default
      continue;
    }

    if (isPlainObject(aValue) && isPlainObject(bValue)) {
      result[key] = deepMerge(aValue, bValue);
    } else {
      // primitives, arrays, null -> B wins outright
      result[key] = bValue;
    }
  }

  return result as T;
}
