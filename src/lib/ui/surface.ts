// Colour treatments and the card frame for elements that aren't buttons (badges, callouts,
// banners), as complete class strings so Tailwind generates them. Call sites use these names
// instead of Skeleton's preset-* and card classes, so replacing Skeleton only changes ui/.
// A name here describes the fill alone: button.ts's `tonal` also adds a border and a hover colour.
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
  'hover-tonal-surface': 'hover:preset-tonal-surface',
} as const;

export type Tone = keyof typeof tones;

export const cardClass = 'card';

// Warning messages (.warning-message in app.css). It sets the fill, border and text colours itself,
// in the components layer, so a tone or colour utility on the same element would override it.
export const warningMessageClass = 'warning-message';
