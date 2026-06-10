import type { SearchResult } from '$lib/models/Search';

/** Count the depth of a concept path by its backslash-delimited segments. */
export function conceptDepth(conceptPath: string): number {
  return conceptPath.split('\\').filter(Boolean).length;
}

/**
 * Sort hierarchy concepts deepest-first (most segments in the concept path first).
 */
export function sortHierarchyDeepestFirst(concepts: SearchResult[]): SearchResult[] {
  return [...concepts].sort((a, b) => conceptDepth(b.conceptPath) - conceptDepth(a.conceptPath));
}
