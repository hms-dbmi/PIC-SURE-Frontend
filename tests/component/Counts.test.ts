// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('$lib/configuration', () => ({
  branding: { explorePage: { queryErrorText: '', filterErrorText: '' } },
  features: {},
}));

vi.mock('$lib/stores/Filter', async () => {
  const { writable } = await import('svelte/store');
  return { filters: writable([]) };
});

const mockState = vi.hoisted(() => ({
  current: {
    loading: false,
    total: 0 as number | string,
    hasNonZero: true,
    snapshot: {
      descriptorKey: 'k',
      count: 0 as number | string | Record<string, number | string>,
      summary: { total: 0 as number | string, hasNonZero: true, hasError: false },
    },
  },
}));

vi.mock('$lib/state/resultCounts.svelte', () => ({
  get resultCountsState() {
    return mockState.current;
  },
}));

import Counts from '$lib/components/explorer/results/Counts.svelte';

function setSnapshot(count: number | string, total: number | string, hasError = false) {
  mockState.current = {
    loading: false,
    total,
    hasNonZero: true,
    snapshot: {
      descriptorKey: 'k',
      count,
      summary: { total, hasNonZero: true, hasError },
    },
  };
}

describe('Counts.svelte rendering', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders an obfuscated count with the ±N suffix preserved (regression: open-access discover)', async () => {
    setSnapshot('600±3', 600);
    render(Counts);
    const node = await screen.findByText('600±3');
    expect(node).toBeInTheDocument();
    expect(node.id).toBe('result-count-number');
  });

  it('renders a plain numeric count with locale formatting', async () => {
    setSnapshot(1234, 1234);
    render(Counts);
    const node = await screen.findByText('1,234');
    expect(node).toBeInTheDocument();
  });

  it('renders an obfuscated "< 10" count without converting it to 0', async () => {
    setSnapshot('< 10', '< 10');
    render(Counts);
    const node = await screen.findByText('< 10');
    expect(node).toBeInTheDocument();
  });

  it('renders a pending state, not the error value, before any load has committed', async () => {
    // What every server render looks like, and the window before the first client load
    // resolves: the singleton is idle, its snapshot empty, and nothing has failed. The panel
    // server-renders now that it no longer sits behind a closed-by-default side panel, so
    // treating this as the error case flashed "N/A participants" on first paint.
    mockState.current = {
      loading: false,
      total: 0,
      hasNonZero: false,
      snapshot: {
        descriptorKey: '',
        count: 0,
        summary: { total: 0, hasNonZero: false, hasError: false },
      },
    };
    render(Counts);
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
    // The strip is a button, so the count only reaches assistive technology as text.
    expect(await screen.findByText('Loading participant count')).toBeInTheDocument();
  });

  it('names the count for assistive technology, which cannot see inside the button', async () => {
    setSnapshot(1234, 1234);
    render(Counts);
    expect(await screen.findByText('1,234 participants')).toBeInTheDocument();
  });

  it('renders N/A on error (single-cell load failure matches the OLD all-cells-failed branch)', async () => {
    setSnapshot(0, 0, true);
    render(Counts);
    const node = await screen.findByText('N/A');
    expect(node).toBeInTheDocument();
    // The numeric count span must NOT render in the error branch.
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
