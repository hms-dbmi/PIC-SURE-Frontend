// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import SkeletonList from '#lib/ui/skeleton/SkeletonList.svelte';
import SkeletonBar from '#lib/ui/skeleton/SkeletonBar.svelte';

describe('SkeletonList', () => {
  it('renders one row per count, hidden from assistive technology', () => {
    render(SkeletonList, { count: 4, 'data-testid': 'facet-list' });

    const list = screen.getByTestId('facet-list');
    expect(list).toHaveAttribute('aria-hidden', 'true');
    expect(list.children).toHaveLength(4);
    expect(screen.getByTestId('facet-list-item-3')).toBe(list.children[3]);
  });

  it('fades the rows out towards the end', () => {
    render(SkeletonList, { count: 3, fade: true, 'data-testid': 'facet-list' });

    const opacity = (index: number) =>
      Number(screen.getByTestId(`facet-list-item-${index}`).style.opacity);
    expect(opacity(0)).toBe(1);
    expect(opacity(1)).toBeLessThan(opacity(0));
    expect(opacity(2)).toBeLessThan(opacity(1));
  });
});

describe('SkeletonBar', () => {
  it('is hidden from assistive technology', () => {
    render(SkeletonBar, { 'data-testid': 'bar' });

    expect(screen.getByTestId('bar')).toHaveAttribute('aria-hidden', 'true');
  });
});
