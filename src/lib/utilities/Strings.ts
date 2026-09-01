/**
 * Cap text at `maxLength` visible characters, replacing the overflow with a single
 * ellipsis. Counts Unicode code points so surrogate pairs are never split.
 */
export function truncate(text: string, maxLength: number): string {
  const characters = Array.from(text);
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
