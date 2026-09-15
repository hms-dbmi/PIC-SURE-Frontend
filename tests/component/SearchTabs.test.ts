// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';

const mockState = vi.hoisted(() => ({
  pathname: '/explorer',
  features: { enableGENEQuery: false, enableSNPQuery: false },
  logSpy: vi.fn(),
}));

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$app/state', () => ({
  page: {
    get url() {
      return new URL(`http://localhost${mockState.pathname}`);
    },
  },
}));
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    get features() {
      return mockState.features;
    },
  },
  resetConfig: () => {},
}));
vi.mock('$lib/logger', () => ({
  log: mockState.logSpy,
  createLog: vi.fn((eventType: string, action: string, metadata?: unknown) => ({
    eventType,
    action,
    metadata,
  })),
  getPageContext: () => 'explorer',
}));

import SearchTabs from '$lib/components/explorer/SearchTabs.svelte';
import { searchTerm } from '$lib/stores/Search';

/** Renders the bar at `pathname`, with genomic search on unless told otherwise. */
function renderAt(pathname: string, { genomic = true, term = '' } = {}) {
  cleanup();
  mockState.pathname = pathname;
  mockState.features = { enableGENEQuery: genomic, enableSNPQuery: false };
  searchTerm.set(term);
  return render(SearchTabs);
}

const modeBar = () => screen.queryByTestId('search-mode-tabs');
const modeLink = (id: string) => screen.getByTestId(`search-mode-tab-${id}`);

describe('SearchTabs', () => {
  beforeEach(() => {
    mockState.pathname = '/explorer';
    mockState.features = { enableGENEQuery: false, enableSNPQuery: false };
    mockState.logSpy.mockClear();
    searchTerm.set('');
  });

  describe('visibility', () => {
    it('renders on Explore when genomic search gives it a second mode', () => {
      renderAt('/explorer');
      expect(modeBar()).toBeInTheDocument();
      expect(screen.getAllByRole('link').map((el) => el.textContent?.trim())).toEqual([
        'Phenotypes',
        'Genotypes',
      ]);
    });

    it('renders nothing on Discover, which has a single mode', () => {
      renderAt('/discover');
      expect(modeBar()).not.toBeInTheDocument();
    });

    it('renders nothing on Explore when genomic search is off', () => {
      renderAt('/explorer', { genomic: false });
      expect(modeBar()).not.toBeInTheDocument();
    });

    // The bar and the cohort panel share one route rule, showsSearchChrome.
    it.each(['/explorer/export', '/explorer/distributions'])(
      'renders nothing on %s, which keeps its own full-page presentation',
      (pathname) => {
        renderAt(pathname);
        expect(modeBar()).not.toBeInTheDocument();
      },
    );

    it.each([
      '/explorer/genotypes',
      '/explorer/advanced-filtering',
      '/explorer/variant',
      '/explorer/variable/age-at-export',
    ])('renders on %s, the same routes the cohort panel renders on', (pathname) => {
      renderAt(pathname);
      expect(modeBar()).toBeInTheDocument();
    });
  });

  describe('links', () => {
    // Anchors, not buttons: middle-click opens a new browser tab, right-click offers
    // Copy Link, and the back button works.
    it('are anchors carrying each mode route', () => {
      renderAt('/explorer');
      expect(modeLink('phenotypes').tagName).toBe('A');
      expect(modeLink('genotypes').tagName).toBe('A');
      expect(modeLink('phenotypes')).toHaveAttribute('href', '/explorer');
      expect(modeLink('genotypes')).toHaveAttribute('href', '/explorer/genotypes');
    });

    // Otherwise switching modes, or copying the link, silently drops the search.
    it('carry the active search term', () => {
      renderAt('/explorer', { term: 'age' });
      expect(modeLink('phenotypes')).toHaveAttribute('href', '/explorer?search=age');
      expect(modeLink('genotypes')).toHaveAttribute('href', '/explorer/genotypes?search=age');
    });

    it('log a navigation event naming the mode', async () => {
      renderAt('/explorer');
      modeLink('genotypes').click();
      expect(mockState.logSpy).toHaveBeenCalledWith({
        eventType: 'NAVIGATION',
        action: 'explorer.search_mode_click',
        metadata: { mode: 'genotypes' },
      });
    });
  });

  describe('accessibility', () => {
    // A navigation landmark, not a tab widget: the modes are routes and there is no
    // tabpanel for role="tab" to control. The name is required because the main navigation
    // is another nav landmark on the same page.
    it('is a navigation landmark with an accessible name', () => {
      renderAt('/explorer');
      expect(modeBar()?.tagName).toBe('NAV');
      expect(modeBar()).toHaveAttribute('aria-label', 'Search modes');
      expect(screen.getByRole('navigation', { name: 'Search modes' })).toBeInTheDocument();
    });

    it('carries no tab-widget semantics', () => {
      renderAt('/explorer');
      expect(document.querySelector('[role="tablist"]')).toBeNull();
      expect(document.querySelector('[role="tab"]')).toBeNull();
      expect(document.querySelector('[aria-selected]')).toBeNull();
      // Links are natively tabbable; a roving tabindex belongs to widgets, not navigation.
      expect(modeLink('phenotypes')).not.toHaveAttribute('tabindex');
    });

    it('marks the current route, and only that one', () => {
      renderAt('/explorer');
      expect(modeLink('phenotypes')).toHaveAttribute('aria-current', 'page');
      expect(modeLink('genotypes')).not.toHaveAttribute('aria-current');

      renderAt('/explorer/genotypes');
      expect(modeLink('genotypes')).toHaveAttribute('aria-current', 'page');
      expect(modeLink('phenotypes')).not.toHaveAttribute('aria-current');
    });

    it('marks Phenotypes on the variable detail page', () => {
      renderAt('/explorer/variable/asthma');
      expect(modeLink('phenotypes')).toHaveAttribute('aria-current', 'page');
      expect(modeLink('genotypes')).not.toHaveAttribute('aria-current');
    });

    it('marks nothing on a sibling route that is not a search mode', () => {
      renderAt('/explorer/advanced-filtering');
      expect(modeBar()?.querySelectorAll('[aria-current]')).toHaveLength(0);
    });
  });
});
