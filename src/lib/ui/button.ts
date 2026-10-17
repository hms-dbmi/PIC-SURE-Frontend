// Every button style the app uses, as complete class strings so Tailwind generates them (no
// `preset-${tone}` assembly). Each entry renders exactly the classes its call sites used before.
// Primary is the default tone; other tones are named after it.
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
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export const buttonSizes = {
  // For buttons styled as something else, like a card.
  none: '',
  md: 'btn',
  sm: 'btn btn-sm',
  xs: 'btn btn-xs',
} as const;

export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(variant: ButtonVariant = 'filled', size: ButtonSize = 'md'): string {
  return `${buttonSizes[size]} ${buttonVariants[variant]}`.trim();
}

// An href with a scheme (https:, mailto:) or a protocol-relative one leaves the app. Paths from
// resolve(), absolute or relative, stay in it.
export function isExternalHref(href: string): boolean {
  return /^([a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}
