// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import ShowMoreButton from '$lib/components/buttons/ShowMoreButton.svelte';

describe('ShowMoreButton', () => {
  it('renders the shared show more style and collapsed state', () => {
    render(ShowMoreButton, {
      expanded: false,
      'data-testid': 'toggle-details',
    });

    const button = screen.getByTestId('toggle-details');
    const icon = button.querySelector('i');

    expect(button).toHaveTextContent('Show More');
    expect(button).toHaveClass('show-more', 'w-fit', 'mx-auto', 'my-1');
    expect(icon).toHaveClass('fa-angle-down');
  });

  it('renders expanded state and handles clicks', async () => {
    const onclick = vi.fn();

    render(ShowMoreButton, {
      expanded: true,
      onclick,
      'data-testid': 'toggle-details',
    });

    const button = screen.getByTestId('toggle-details');
    const icon = button.querySelector('i');

    expect(button).toHaveTextContent('Show Less');
    expect(icon).toHaveClass('fa-angle-up');

    await fireEvent.click(button);

    expect(onclick).toHaveBeenCalledOnce();
  });
});
