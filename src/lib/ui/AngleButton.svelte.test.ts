// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import AngleButton from '#lib/ui/AngleButton.svelte';

describe('AngleButton', () => {
  // Every class must be a complete token Tailwind generates; a doubled shade such as
  // preset-filled-primary-500-500 generates nothing.
  it.each([
    ['tonal', ['preset-tonal-primary', 'hover:preset-filled-primary-500']],
    ['filled', ['preset-filled-primary-500']],
  ] as const)('%s uses the primary preset classes', (variant, classes) => {
    render(AngleButton, { variant, 'data-testid': 'angle' });

    const button = screen.getByTestId('angle');
    expect(button).toHaveClass(...classes);
    expect(button.className).not.toMatch(/-500-500/);
  });
});
