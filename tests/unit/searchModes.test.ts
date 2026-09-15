import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFeatures = vi.hoisted(() => ({
  enableGENEQuery: false,
  enableSNPQuery: false,
}));

vi.mock('$lib/configuration.svelte', () => ({ config: { features: mockFeatures } }));

import {
  emptyCohortText,
  emptyCohortTextAt,
  enabledSearchModes,
  genotypesMode,
  inlineModeLabel,
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

  // An acronym mode is the case the default gets wrong, and SPEC 4.3 names FHIR as one of the
  // modes to come - so the mode owns the word, not the sentence.
  describe('inlineModeLabel', () => {
    it('lowercases an ordinary label, which is what the two current modes need', () => {
      expect(inlineModeLabel(phenotypesMode)).toBe('phenotypes');
      expect(inlineModeLabel(genotypesMode)).toBe('genotypes');
    });

    it('leaves an acronym mode the casing it declares', () => {
      expect(inlineModeLabel({ ...phenotypesMode, label: 'FHIR', inlineLabel: 'FHIR' })).toBe(
        'FHIR',
      );
      expect(inlineModeLabel({ ...phenotypesMode, label: 'dbGaP', inlineLabel: 'dbGaP' })).toBe(
        'dbGaP',
      );
    });
  });

  // The empty state has to grow on its own when Studies and FHIR land, so the list-building
  // is tested at mode counts the registry does not have yet - not only at the two real ones,
  // which a hardcoded pair of strings would also satisfy.
  describe('emptyCohortText', () => {
    it('names a single mode with no dangling "or" and no trailing comma', () => {
      const text = emptyCohortText(['phenotypes']);
      expect(text).toBe('No filters yet - add one from the phenotypes page below');
      expect(text).not.toContain(' or ');
      expect(text).not.toContain(',');
    });

    it('joins two modes with "or"', () => {
      expect(emptyCohortText(['phenotypes', 'genotypes'])).toBe(
        'No filters yet - add one from the phenotypes or genotypes page below',
      );
    });

    it('joins three modes as "a, b or c"', () => {
      expect(emptyCohortText(['phenotypes', 'genotypes', 'studies'])).toBe(
        'No filters yet - add one from the phenotypes, genotypes or studies page below',
      );
    });

    // The last entry is an acronym on purpose: the sentence must not touch the casing it is
    // handed, or the first person to add FHIR ships "fhir" to users.
    it('joins four modes with a comma between every pair but the last', () => {
      expect(emptyCohortText(['phenotypes', 'genotypes', 'studies', 'FHIR'])).toBe(
        'No filters yet - add one from the phenotypes, genotypes, studies or FHIR page below',
      );
    });
  });

  describe('emptyCohortTextAt', () => {
    it('names both modes on Explore when genomic search is on', () => {
      mockFeatures.enableGENEQuery = true;
      expect(emptyCohortTextAt('/explorer')).toBe(
        'No filters yet - add one from the phenotypes or genotypes page below',
      );
    });

    // Both genomic flags off is a real deployment, and it gets Discover's sentence on Explore.
    it('names phenotypes alone on Explore when neither genomic query is enabled', () => {
      expect(emptyCohortTextAt('/explorer')).toBe(
        'No filters yet - add one from the phenotypes page below',
      );
    });

    it('names phenotypes alone on Discover even with both genomic queries enabled', () => {
      mockFeatures.enableGENEQuery = true;
      mockFeatures.enableSNPQuery = true;
      expect(emptyCohortTextAt('/discover')).toBe(
        'No filters yet - add one from the phenotypes page below',
      );
      expect(emptyCohortTextAt('/discover/advanced-filtering')).toBe(
        'No filters yet - add one from the phenotypes page below',
      );
    });

    // The acceptance criterion, exercised end to end through the registry: a third entry and
    // nothing else changes the sentence the panel renders. FHIR is the entry SPEC 4.3 names
    // next, and the one whose casing a lowercasing sentence would break.
    it('grows by itself when a third mode joins the registry', () => {
      mockFeatures.enableGENEQuery = true;
      searchModes.push({
        id: 'fhir',
        label: 'FHIR',
        inlineLabel: 'FHIR',
        route: '/explorer/fhir',
        enabled: () => true,
        isActive: () => false,
      });
      try {
        expect(emptyCohortTextAt('/explorer')).toBe(
          'No filters yet - add one from the phenotypes, genotypes or FHIR page below',
        );
      } finally {
        searchModes.pop();
      }
      expect(searchModes.map((mode) => mode.id)).toEqual(['phenotypes', 'genotypes']);
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
