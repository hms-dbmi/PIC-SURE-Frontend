// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import OperatorBadge from '#lib/ui/OperatorBadge.svelte';

describe('OperatorBadge', () => {
  it('gives AND and OR different tones', () => {
    render(OperatorBadge, { operator: 'AND' });
    render(OperatorBadge, { operator: 'OR' });

    expect(screen.getByText('AND').className).not.toBe(screen.getByText('OR').className);
  });

  it('drops the operator tone when neutral', () => {
    render(OperatorBadge, { operator: 'AND', tone: 'neutral' });
    render(OperatorBadge, { operator: 'OR', tone: 'neutral' });

    expect(screen.getByText('AND').className).toBe(screen.getByText('OR').className);
  });
});
