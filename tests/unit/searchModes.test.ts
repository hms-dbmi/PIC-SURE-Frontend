import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFeatures = vi.hoisted(() => ({
  enableGENEQuery: false,
  enableSNPQuery: false,
}));

vi.mock('$lib/configuration.svelte', () => ({ config: { features: mockFeatures } }));

import {
  enabledSearchModes,
  genotypesMode,
  phenotypesMode,
  searchModeHref,
  searchModes,
} from '$lib/explorer/searchModes';

function idsFor(pathname: string): string[] {
  return enabledSearchModes(pathname).map((mode) => mode.id);
}

describe('the search mode registry', () => {
  beforeEach(() => {
    mockFeatures.enableGENEQuery = false;
    mockFeatures.enableSNPQuery = false;
  });

  it('is phenotypes then genotypes, in display order', () => {
    expect(searchModes.map((mode) => mode.id)).toEqual(['phenotypes', 'genotypes']);
    expect(searchModes.map((mode) => mode.label)).toEqual(['Phenotypes', 'Genotypes']);
  });

  // The whole point of not redirecting to /explorer/phenotypes: every existing link, the
  // configuration.json sitemap entry and the e2e paths keep working.
  it('keeps /explorer as the canonical Phenotypes route', () => {
    expect(phenotypesMode.route).toBe('/explorer');
    expect(genotypesMode.route).toBe('/explorer/genotypes');
  });

  describe('enablement', () => {
    it('always enables phenotypes', () => {
      expect(phenotypesMode.enabled(false)).toBe(true);
      expect(phenotypesMode.enabled(true)).toBe(true);
    });

    it.each([
      { gene: true, snp: true },
      { gene: true, snp: false },
      { gene: false, snp: true },
    ])('enables genotypes on Explore when GENE=$gene SNP=$snp', ({ gene, snp }) => {
      mockFeatures.enableGENEQuery = gene;
      mockFeatures.enableSNPQuery = snp;
      expect(genotypesMode.enabled(false)).toBe(true);
    });

    it('disables genotypes on Explore when neither genomic query is enabled', () => {
      expect(genotypesMode.enabled(false)).toBe(false);
    });

    it('disables genotypes on Discover even with both genomic queries enabled', () => {
      mockFeatures.enableGENEQuery = true;
      mockFeatures.enableSNPQuery = true;
      expect(genotypesMode.enabled(true)).toBe(false);
    });
  });

  describe('enabledSearchModes', () => {
    it('yields both modes on Explore when genomic search is on, so the bar renders', () => {
      mockFeatures.enableGENEQuery = true;
      expect(idsFor('/explorer')).toEqual(['phenotypes', 'genotypes']);
      expect(idsFor('/explorer/genotypes')).toEqual(['phenotypes', 'genotypes']);
    });

    it('yields one mode on Explore when genomic search is off, so no bar renders', () => {
      expect(idsFor('/explorer')).toEqual(['phenotypes']);
    });

    // Discover has a single mode by configuration, not by luck - which is also what makes
    // the Explore-only route on the phenotypes entry safe: no Discover bar ever renders.
    it('yields one mode on Discover whatever the genomic flags say', () => {
      mockFeatures.enableGENEQuery = true;
      mockFeatures.enableSNPQuery = true;
      expect(idsFor('/discover')).toEqual(['phenotypes']);
      expect(idsFor('/discover/advanced-filtering')).toEqual(['phenotypes']);
    });

    // A variable slug spelling `discover` must not flip the section and drop the Genotypes
    // mode from a detail page under /explorer.
    it('stays on Explore when a deeper segment merely spells discover', () => {
      mockFeatures.enableGENEQuery = true;
      expect(idsFor('/explorer/variable/discover')).toEqual(['phenotypes', 'genotypes']);
    });
  });

  describe('isActive', () => {
    it.each(['/explorer', '/explorer/', '/discover', '/discover/'])(
      'marks phenotypes active on the section root %s',
      (pathname) => {
        expect(phenotypesMode.isActive(pathname)).toBe(true);
        expect(genotypesMode.isActive(pathname)).toBe(false);
      },
    );

    // Each mode matches its own route and anything beneath it, so a detail page keeps its
    // parent mode selected.
    it.each(['/explorer/genotypes', '/explorer/genotypes/', '/explorer/genotypes/BRCA1'])(
      'marks genotypes active on %s',
      (pathname) => {
        expect(genotypesMode.isActive(pathname)).toBe(true);
        expect(phenotypesMode.isActive(pathname)).toBe(false);
      },
    );

    it.each([
      '/explorer/variable/asthma',
      '/discover/variable/asthma',
      '/explorer/variable/age-at-export',
    ])('marks phenotypes active on its detail page %s', (pathname) => {
      expect(phenotypesMode.isActive(pathname)).toBe(true);
      expect(genotypesMode.isActive(pathname)).toBe(false);
    });

    // Sibling routes under the layout belong to no mode, and a bar with nothing marked is
    // the honest rendering of that.
    it.each(['/explorer/advanced-filtering', '/explorer/variant', '/explorer/genome-filter'])(
      'marks no mode active on %s',
      (pathname) => {
        expect(searchModes.some((mode) => mode.isActive(pathname))).toBe(false);
      },
    );

    it.each(['', '/', '/dashboard'])(
      'marks no mode active outside the section, on %s',
      (pathname) => expect(searchModes.some((mode) => mode.isActive(pathname))).toBe(false),
    );

    it('never marks genotypes active on Discover, which cannot reach the route', () => {
      expect(genotypesMode.isActive('/discover/genotypes')).toBe(false);
    });
  });

  // Without this, Copy Link on Phenotypes yields a link that discards the user's search and
  // the address bar stops agreeing with the results on screen.
  describe('searchModeHref', () => {
    it('carries the active search term', () => {
      expect(searchModeHref(phenotypesMode, 'age')).toBe('/explorer?search=age');
      expect(searchModeHref(genotypesMode, 'age')).toBe('/explorer/genotypes?search=age');
    });

    it('encodes terms that are not URL-safe', () => {
      expect(searchModeHref(phenotypesMode, 'age at exam & more')).toBe(
        '/explorer?search=age%20at%20exam%20%26%20more',
      );
    });

    it('is the bare route when there is no search', () => {
      expect(searchModeHref(phenotypesMode, '')).toBe('/explorer');
      expect(searchModeHref(genotypesMode, '')).toBe('/explorer/genotypes');
    });
  });
});
