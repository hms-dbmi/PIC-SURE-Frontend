const graphemeSegmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : undefined;

/** Split into grapheme clusters, or code points when Intl.Segmenter is unavailable. */
export function graphemes(text: string): string[] {
  if (!graphemeSegmenter) return Array.from(text);
  return Array.from(graphemeSegmenter.segment(text), (segment) => segment.segment);
}

/** Count text using the same units as truncate. */
export function visibleLength(text: string): number {
  return graphemes(text).length;
}

/** Truncate by grapheme cluster, reserving one character for the ellipsis. Falls back to code points without Intl.Segmenter. */
export function truncate(text: string, maxLength: number): string {
  const characters = graphemes(text);
  if (characters.length <= maxLength) return text;
  return `${characters
    .slice(0, maxLength - 1)
    .join('')
    .trimEnd()}…`;
}

// Turns a raw config key (e.g. 'MAX_DATA_POINTS_FOR_EXPORT') into a display label
// (e.g. 'Max Data Points For Export'). Presentation only - never stored as schema data.
export function humanizeKey(name: string): string {
  return name
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
