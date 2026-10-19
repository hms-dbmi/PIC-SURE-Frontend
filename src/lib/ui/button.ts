// Every button style the app uses, as complete class strings so Tailwind generates them (no
// `preset-${tone}` assembly). Names without a tone suffix are primary.
export const buttonVariants = {
  none: '',
  filled: 'preset-filled-primary-500',
  'filled-surface': 'preset-filled-surface-500',
  'filled-error': 'preset-filled-error-500',
  tonal: 'preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500',
  'tonal-secondary':
    'preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500',
  'tonal-surface': 'preset-tonal-surface border border-surface-500 hover:preset-filled-surface-500',
  'tonal-error': 'preset-tonal-error border border-error-500 hover:preset-filled-error-500',
  // Tonal with a border in the text colour instead of the tone.
  soft: 'border preset-tonal-primary hover:preset-filled-primary-500',
  outlined:
    'preset-outlined-primary-500 text-primary-500 hover:preset-filled-primary-500 hover:text-white',
  'outlined-error':
    'preset-outlined-error-500 text-error-700 hover:preset-filled-error-500 hover:text-white',
  'outlined-surface':
    'preset-outlined-surface-500 hover:preset-tonal-primary border border-primary-500',
  'outlined-warning': 'preset-outlined-warning-500 hover:preset-filled-warning-500',
  'filled-secondary': 'preset-filled-secondary-500',
  // Turns tonal when disabled.
  'filled-bordered':
    'preset-filled-primary-500 disabled:preset-tonal-primary border border-primary-500',
  // The `-static` variants and `tint` have no hover colour, as they were before the table existed.
  'tonal-static': 'preset-tonal-primary border border-primary-500',
  'soft-static': 'border preset-tonal-primary',
  'soft-error-static': 'border preset-tonal-error',
  'outlined-static': 'preset-outlined-primary-500',
  // Tonal fill only, without a border.
  tint: 'preset-tonal-primary',
  'tint-error': 'preset-tonal-error',
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export const buttonSizes = {
  // For buttons styled as something else, like a card.
  none: '',
  md: 'btn',
  sm: 'btn btn-sm',
  xs: 'btn btn-xs',
  // Small text and padding without the btn frame.
  compact: 'btn-sm',
  icon: 'btn btn-icon',
  'icon-sm': 'btn-icon btn-icon-sm',
} as const;

export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(variant: ButtonVariant = 'filled', size: ButtonSize = 'md'): string {
  return `${buttonSizes[size]} ${buttonVariants[variant]}`.trim();
}

// resolve() output always starts with '/' or '.' (relative during SSR); anything else, including
// a configured 'guide.pdf', is treated as leaving the app, as config links always were.
export function isExternalHref(href: string): boolean {
  return !/^[./]/.test(href) || href.startsWith('//');
}
