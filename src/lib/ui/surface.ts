// Colour treatments and the card frame for elements that aren't buttons (badges, callouts,
// banners), as complete class strings so Tailwind generates them. Call sites use these names
// instead of Skeleton's preset-* and card classes, so replacing Skeleton only changes ui/.
export const tones = {
  'filled-primary': 'preset-filled-primary-500',
  'filled-success': 'preset-filled-success-500',
  'filled-warning': 'preset-filled-warning-500',
  'filled-error': 'preset-filled-error-500',
  'filled-surface': 'preset-filled-surface-500',
  // Lighter fills in light mode, darker in dark mode.
  'filled-primary-subtle': 'preset-filled-primary-200-800',
  'filled-secondary-subtle': 'preset-filled-secondary-200-800',
  'filled-surface-subtle': 'preset-filled-surface-200-800',
  'tonal-primary': 'preset-tonal-primary',
  'tonal-secondary': 'preset-tonal-secondary',
  'tonal-tertiary': 'preset-tonal-tertiary',
  'tonal-success': 'preset-tonal-success',
  'tonal-warning': 'preset-tonal-warning',
  'tonal-error': 'preset-tonal-error',
  'tonal-surface': 'preset-tonal-surface',
  'outlined-surface': 'preset-outlined-surface-500',
  // For rows of a list that highlight under the pointer.
  'hover-tonal-surface': 'hover:preset-tonal-surface',
} as const;

export type Tone = keyof typeof tones;

export const cardClass = 'card';
