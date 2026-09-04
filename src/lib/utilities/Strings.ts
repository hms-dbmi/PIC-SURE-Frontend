const graphemeSegmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : undefined;

/**
 * Split text into user-perceived characters (grapheme clusters) so flags, emoji
 * sequences and combining marks are never cut apart. Falls back to code points
 * where Intl.Segmenter is unavailable.
 */
export function graphemes(text: string): string[] {
  if (!graphemeSegmenter) return Array.from(text);
  return Array.from(graphemeSegmenter.segment(text), (segment) => segment.segment);
}

/** Number of user-perceived characters in `text`: the same unit `truncate` counts in. */
export function visibleLength(text: string): number {
  return graphemes(text).length;
}

/**
 * Cap text at `maxLength` visible characters, replacing the overflow with a single
 * ellipsis. Counts grapheme clusters so surrogate pairs, flags and combining marks
 * are never split.
 */
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
