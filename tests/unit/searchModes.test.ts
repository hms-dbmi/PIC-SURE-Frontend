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
  isDiscoverPath,
  phenotypesMode,
  searchModes,
  type SearchMode,
} from '$lib/explorer/searchModes';

function idsFor(pathname: string): string[] {
  return enabledSearchModes(pathname).map((mode) => mode.id);
}

describe('the search mode registry', () => {
  beforeEach(() => {
    mockFeatures.enableGENEQuery = false;
    mockFeatures.enableSNPQuery = false;
  });

  it('is phenotypes then genotypes, in tab order', () => {
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
    it('yields both modes on Explore when genomic search is on, so the tab bar renders', () => {
      mockFeatures.enableGENEQuery = true;
      expect(idsFor('/explorer')).toEqual(['phenotypes', 'genotypes']);
      expect(idsFor('/explorer/genotypes')).toEqual(['phenotypes', 'genotypes']);
    });

    it('yields one mode on Explore when genomic search is off, so no tab bar renders', () => {
      expect(idsFor('/explorer')).toEqual(['phenotypes']);
    });

    // Discover has a single mode by configuration, not by luck - which is also what makes
    // the Explore-only route on the phenotypes entry safe: no Discover tab bar ever renders.
    it('yields one mode on Discover whatever the genomic flags say', () => {
      mockFeatures.enableGENEQuery = true;
      mockFeatures.enableSNPQuery = true;
      expect(idsFor('/discover')).toEqual(['phenotypes']);
      expect(idsFor('/discover/advanced-filtering')).toEqual(['phenotypes']);
    });
  });

  describe('isActive', () => {
    it.each(['/explorer', '/discover'])(
      'marks phenotypes active on the section root %s',
      (pathname) => {
        expect(phenotypesMode.isActive(pathname)).toBe(true);
        expect(genotypesMode.isActive(pathname)).toBe(false);
      },
    );

    it('marks genotypes active on /explorer/genotypes', () => {
      expect(genotypesMode.isActive('/explorer/genotypes')).toBe(true);
      expect(phenotypesMode.isActive('/explorer/genotypes')).toBe(false);
    });

    // Sibling routes under the layout belong to no mode, and a mode bar with nothing
    // current is the honest rendering of that.
    it.each(['/explorer/advanced-filtering', '/explorer/variant'])(
      'marks no mode active on %s',
      (pathname) => {
        expect(searchModes.some((mode) => mode.isActive(pathname))).toBe(false);
      },
    );
  });

  describe('isDiscoverPath', () => {
    it.each(['/discover', '/discover/distributions', '/picsure/discover'])(
      'is true for %s',
      (pathname) => expect(isDiscoverPath(pathname)).toBe(true),
    );

    it.each(['/explorer', '/explorer/genotypes', '/dashboard', ''])('is false for %s', (pathname) =>
      expect(isDiscoverPath(pathname)).toBe(false),
    );
  });

  // The empty state has to grow on its own when Studies and FHIR land, so the list-building
  // is tested at mode counts the registry does not have yet - not only at the two real ones,
  // which a hardcoded pair of strings would also satisfy.
  describe('emptyCohortText', () => {
    it('names a single mode with no dangling "or" and no trailing comma', () => {
      const text = emptyCohortText(['Phenotypes']);
      expect(text).toBe('No filters yet - add one from the phenotypes page below');
      expect(text).not.toContain(' or ');
      expect(text).not.toContain(',');
    });

    it('joins two modes with "or"', () => {
      expect(emptyCohortText(['Phenotypes', 'Genotypes'])).toBe(
        'No filters yet - add one from the phenotypes or genotypes page below',
      );
    });

    it('joins three modes as "a, b or c"', () => {
      expect(emptyCohortText(['Phenotypes', 'Genotypes', 'Studies'])).toBe(
        'No filters yet - add one from the phenotypes, genotypes or studies page below',
      );
    });

    it('joins four modes with a comma between every pair but the last', () => {
      expect(emptyCohortText(['Phenotypes', 'Genotypes', 'Studies', 'FHIR'])).toBe(
        'No filters yet - add one from the phenotypes, genotypes, studies or fhir page below',
      );
    });

    // Unreachable from the panel, which only renders inside the search section where
    // phenotypes is always enabled - but the sentence should not read "from the  page below".
    it('drops the list entirely when there are no modes', () => {
      expect(emptyCohortText([])).toBe('No filters yet - add one below');
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
    // nothing else changes the sentence the panel renders.
    it('grows by itself when a third mode joins the registry', () => {
      mockFeatures.enableGENEQuery = true;
      const studiesMode: SearchMode = {
        id: 'studies',
        label: 'Studies',
        route: '/explorer/studies',
        enabled: () => true,
        isActive: () => false,
      };
      searchModes.push(studiesMode);
      try {
        expect(emptyCohortTextAt('/explorer')).toBe(
          'No filters yet - add one from the phenotypes, genotypes or studies page below',
        );
      } finally {
        searchModes.splice(searchModes.indexOf(studiesMode), 1);
      }
      expect(searchModes.map((mode) => mode.id)).toEqual(['phenotypes', 'genotypes']);
    });
  });
});
