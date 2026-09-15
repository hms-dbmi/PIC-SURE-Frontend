// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';

// Which section the panel thinks it is in decides the export affordance and where the tool
// suite points. Getting it from a substring test for "/discover" says yes to an Explore
// variable whose slug merely starts with those letters, so it is asserted here on a deeper
// route with exactly that shape.
const route = vi.hoisted(() => ({ pathname: '/explorer' }));

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
  page: {
    get url() {
      return new URL(`http://localhost${route.pathname}`);
    },
  },
}));

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features: {
      discover: true,
      explorer: {
        allowExport: true,
        exportsEnableExport: false,
        distributionExplorer: true,
        variantExplorer: true,
      },
    },
  },
}));

vi.mock('$lib/state/resultCounts.svelte', () => ({
  resultCountsState: { loading: false, total: 9999, hasNonZero: true },
}));
vi.mock('$lib/services/counts/countFormat', () => ({ isObfuscatedBelowThreshold: () => false }));

vi.mock('$lib/stores/Filter', async () => {
  const { writable, readable } = await import('svelte/store');
  return {
    // One non-genomic filter: enough for both the export button and the distributions card.
    allFilters: writable([{ filterType: 'categorical' }]),
    // True so the Variant Explorer card renders and its active state can be asserted.
    hasGenomicFilter: readable(true),
    clearFilters: vi.fn(),
  };
});
vi.mock('$lib/stores/Export', async () => {
  const { writable } = await import('svelte/store');
  return { exports: writable([]), clearExports: vi.fn() };
});

vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));

// Children with dependencies of their own, none of which this spec is about. CardButton is
// left real: its href is the assertion.
vi.mock('$lib/components/Modal.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/explorer/results/Filters.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/explorer/results/ExportedVariable.svelte', () => ({ default: () => {} }));

import ResultsPanel from '$lib/components/explorer/results/ResultsPanel.svelte';

const exportButton = () => document.querySelector('#export-data-button');
const distributionsHref = () =>
  screen.getByTestId('distributions-btn').closest('a')?.getAttribute('href');
const variantCardIsActive = () =>
  screen.getByTestId('variant-explorer-btn').classList.contains('preset-filled-primary-500');

describe('ResultsPanel section decision', () => {
  beforeEach(() => {
    cleanup();
    route.pathname = '/explorer';
  });

  it.each([
    '/explorer',
    '/explorer/variable/discoverable-trait',
    '/explorer/variable/discover',
    '/explorer/discover',
  ])('is Explore on %s: offers the export and links Explore distributions', (pathname) => {
    route.pathname = pathname;
    render(ResultsPanel);
    expect(exportButton()).toBeInTheDocument();
    expect(distributionsHref()).toBe('/explorer/distributions');
  });

  it.each(['/discover', '/discover/advanced-filtering', '/discover/variable/explorer-trait'])(
    'is Discover on %s: no export, and links Discover distributions',
    (pathname) => {
      route.pathname = pathname;
      render(ResultsPanel);
      expect(exportButton()).not.toBeInTheDocument();
      expect(distributionsHref()).toBe('/discover/distributions');
    },
  );
});

// The Variant Explorer card marks itself active on its own route and nowhere else. The two
// sibling routes below are the cases that tell segment matching apart from the substring test
// this replaced: a variable slug cannot, since its detail route interposes `/variable/`.
describe('ResultsPanel variant route match', () => {
  beforeEach(() => {
    cleanup();
    route.pathname = '/explorer';
  });

  it('marks the card active on the variant route', () => {
    route.pathname = '/explorer/variant';
    render(ResultsPanel);
    expect(variantCardIsActive()).toBe(true);
  });

  // Explore routes only: on Discover the card is not rendered at all, which the section
  // describe above covers - asserting its active state there would pass on a missing element.
  it.each(['/explorer', '/explorer/variants', '/explorer/variant-explorer'])(
    'leaves the card inactive on %s',
    (pathname) => {
      route.pathname = pathname;
      render(ResultsPanel);
      expect(variantCardIsActive()).toBe(false);
    },
  );
});
