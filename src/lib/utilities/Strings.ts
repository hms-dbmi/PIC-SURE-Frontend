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
