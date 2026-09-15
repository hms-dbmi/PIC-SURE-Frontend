// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

const mockState = vi.hoisted(() => ({
  pathname: '/explorer',
  features: { enableGENEQuery: false, enableSNPQuery: false },
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

import SearchTabs from '$lib/components/explorer/SearchTabs.svelte';

/** Renders the bar at `pathname`, with genomic search on unless told otherwise. */
function renderAt(pathname: string, { genomic = true } = {}) {
  cleanup();
  mockState.pathname = pathname;
  mockState.features = { enableGENEQuery: genomic, enableSNPQuery: false };
  return render(SearchTabs);
}

const tabBar = () => screen.queryByTestId('search-mode-tabs');
const tab = (id: string) => screen.getByTestId(`search-mode-tab-${id}`);

describe('SearchTabs', () => {
  beforeEach(() => {
    mockState.pathname = '/explorer';
    mockState.features = { enableGENEQuery: false, enableSNPQuery: false };
  });

  describe('visibility', () => {
    it('renders on Explore when genomic search gives it a second mode', () => {
      renderAt('/explorer');
      expect(tabBar()).toBeInTheDocument();
      expect(screen.getAllByRole('tab').map((el) => el.textContent?.trim())).toEqual([
        'Phenotypes',
        'Genotypes',
      ]);
    });

    it('renders nothing on Discover, which has a single mode', () => {
      renderAt('/discover');
      expect(tabBar()).not.toBeInTheDocument();
    });

    it('renders nothing on Explore when genomic search is off', () => {
      renderAt('/explorer', { genomic: false });
      expect(tabBar()).not.toBeInTheDocument();
    });

    // The tab bar and ALS-12835's cohort panel share one route rule, showsSearchChrome.
    it.each(['/explorer/export', '/explorer/distributions'])(
      'renders nothing on %s, which keeps its own full-page presentation',
      (pathname) => {
        renderAt(pathname);
        expect(tabBar()).not.toBeInTheDocument();
      },
    );

    it.each(['/explorer/genotypes', '/explorer/advanced-filtering', '/explorer/variant'])(
      'renders on %s, the same routes the cohort panel renders on',
      (pathname) => {
        renderAt(pathname);
        expect(tabBar()).toBeInTheDocument();
      },
    );
  });

  describe('links', () => {
    // Anchors, not buttons: middle-click opens a new browser tab, right-click offers
    // Copy Link, and the back button works.
    it('are anchors carrying each mode route', () => {
      renderAt('/explorer');
      expect(tab('phenotypes').tagName).toBe('A');
      expect(tab('genotypes').tagName).toBe('A');
      expect(tab('phenotypes')).toHaveAttribute('href', '/explorer');
      expect(tab('genotypes')).toHaveAttribute('href', '/explorer/genotypes');
    });
  });

  describe('accessibility', () => {
    it('is a tablist of tabs', () => {
      renderAt('/explorer');
      expect(tabBar()).toHaveAttribute('role', 'tablist');
      expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('selects the tab matching the route, and only that one', () => {
      renderAt('/explorer');
      expect(tab('phenotypes')).toHaveAttribute('aria-selected', 'true');
      expect(tab('phenotypes')).toHaveAttribute('aria-current', 'page');
      expect(tab('genotypes')).toHaveAttribute('aria-selected', 'false');
      expect(tab('genotypes')).not.toHaveAttribute('aria-current');

      renderAt('/explorer/genotypes');
      expect(tab('genotypes')).toHaveAttribute('aria-selected', 'true');
      expect(tab('genotypes')).toHaveAttribute('aria-current', 'page');
      expect(tab('phenotypes')).toHaveAttribute('aria-selected', 'false');
      expect(tab('phenotypes')).not.toHaveAttribute('aria-current');
    });

    it('selects Phenotypes on the variable detail page', () => {
      renderAt('/explorer/variable/asthma');
      expect(tab('phenotypes')).toHaveAttribute('aria-selected', 'true');
    });

    it('selects nothing on a sibling route that is not a search mode', () => {
      renderAt('/explorer/advanced-filtering');
      expect(tab('phenotypes')).toHaveAttribute('aria-selected', 'false');
      expect(tab('genotypes')).toHaveAttribute('aria-selected', 'false');
    });

    it('gives the tab stop to the selected tab', () => {
      renderAt('/explorer/genotypes');
      expect(tab('phenotypes')).toHaveAttribute('tabindex', '-1');
      expect(tab('genotypes')).toHaveAttribute('tabindex', '0');
    });

    // Otherwise the whole bar would fall out of the keyboard order on routes where no tab
    // is selected.
    it('gives the tab stop to the first tab when nothing is selected', () => {
      renderAt('/explorer/advanced-filtering');
      expect(tab('phenotypes')).toHaveAttribute('tabindex', '0');
      expect(tab('genotypes')).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('arrow keys', () => {
    it('move focus right and left', async () => {
      renderAt('/explorer');
      tab('phenotypes').focus();

      await fireEvent.keyDown(tab('phenotypes'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tab('genotypes'));

      await fireEvent.keyDown(tab('genotypes'), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(tab('phenotypes'));
    });

    it('wrap around at both ends', async () => {
      renderAt('/explorer');
      tab('phenotypes').focus();

      await fireEvent.keyDown(tab('phenotypes'), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(tab('genotypes'));

      await fireEvent.keyDown(tab('genotypes'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tab('phenotypes'));
    });

    // Manual activation: arrowing must not navigate, or every keypress would be a page load.
    it('leave other keys alone', async () => {
      renderAt('/explorer');
      tab('phenotypes').focus();

      await fireEvent.keyDown(tab('phenotypes'), { key: 'ArrowDown' });
      expect(document.activeElement).toBe(tab('phenotypes'));
    });
  });
});
