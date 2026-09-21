import type { SearchResult } from '$lib/models/Search';

/**
 * Concept detail needs both halves of the key, so the URL carries both.
 *
 * Not `objectUUID`: it hashes against a `SESSION_NAMESPACE` regenerated on every page load
 * (`$lib/utilities/UUID.ts`), so any id the frontend mints dies on refresh.
 */
export type VariableKey = {
  dataset: string;
  conceptPath: string;
};

export type SearchSection = 'explorer' | 'discover';

/** Must match the `variable/` route directory under both section roots. */
export const VARIABLE_SEGMENT = 'variable';

export function encodeVariableKey({ dataset, conceptPath }: VariableKey): string {
  return `${encodeURIComponent(dataset)}/${encodeURIComponent(conceptPath)}`;
}

/** SvelteKit percent-decodes route params before a load sees them, so this only judges what arrived. */
export function variableKeyFromParams(params: {
  dataset?: string;
  conceptPath?: string;
}): VariableKey | undefined {
  const { dataset = '', conceptPath = '' } = params;
  // Trimmed only to judge presence: whitespace inside a concept path is meaningful, and a
  // key that came back trimmed would no longer address the concept it was built from.
  if (!dataset.trim() || !conceptPath.trim()) return undefined;
  return { dataset, conceptPath };
}

export function variableDetailHref(
  section: SearchSection,
  result: Pick<SearchResult, 'dataset' | 'conceptPath'>,
): string {
  const key = encodeVariableKey({ dataset: result.dataset, conceptPath: result.conceptPath });
  return `/${section}/${VARIABLE_SEGMENT}/${key}`;
}
