// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';

const mockState = vi.hoisted(() => ({
  // HierarchyComponent reads the pathname to decide whether filtering is allowed; the page
  // itself is told its section rather than inferring one.
  pathname: '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
  section: 'explorer' as 'explorer' | 'discover',
  enableHierarchy: false,
  exportsEnableExport: true,
  loggedIn: true,
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
      return {
        explorer: {
          enableHierarchy: mockState.enableHierarchy,
          exportsEnableExport: mockState.exportsEnableExport,
        },
      };
    },
    branding: { applicationName: 'PIC-SURE', explorePage: { resultInfo: {} } },
  },
  resetConfig: () => {},
}));

import VariableDetail from '$lib/components/explorer/VariableDetail.svelte';
import { log } from '$lib/logger';
import { getConceptDetails, getHierarchyConcepts } from '$lib/stores/Dictionary';
import { clearExports } from '$lib/stores/Export';
import { clearFilters } from '$lib/stores/Filter';
import { searchTerm } from '$lib/stores/Search';
import type { SearchResult } from '$lib/models/Search';
import type { VariableKey } from '$lib/explorer/variableUrl';

vi.mock('$lib/stores/Dictionary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/Dictionary')>()),
  getConceptDetails: vi.fn(),
  getHierarchyConcepts: vi.fn(),
}));

// The filter and export stores are the real ones - they are what the assertions are about -
// so only the two edges that would leave the process are replaced: the log POST and the
// toast host. `isUserLoggedIn` reads localStorage, which is the other half of the
// open-access rule.
vi.mock('$lib/logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/logger')>()),
  log: vi.fn(),
}));
vi.mock('$lib/toaster', () => ({ toaster: { error: vi.fn(), success: vi.fn() } }));
vi.mock('$lib/stores/User', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/User')>()),
  isUserLoggedIn: () => mockState.loggedIn,
}));

const variableKey: VariableKey = {
  dataset: 'test_data_set',
  conceptPath: '\\this\\is\\a\\age\\',
};

const detail = {
  conceptPath: '\\this\\is\\a\\age\\',
  dataset: 'test_data_set',
  name: 'age1',
  display: 'Age at exam',
  studyAcronym: 'TDS',
  description: 'Age',
  type: 'Continuous',
  allowFiltering: true,
} as SearchResult;

async function renderDetail(overrides: Partial<SearchResult> = {}) {
  vi.mocked(getConceptDetails).mockResolvedValue({ ...detail, ...overrides });
  render(VariableDetail, { section: mockState.section, variableKey });
  await screen.findByTestId('variable-identity');
}

/** Renders with a dictionary that answers `response`, however unlike a concept it is. */
async function renderResponse(response: unknown) {
  vi.mocked(getConceptDetails).mockResolvedValue(response as SearchResult);
  render(VariableDetail, { section: mockState.section, variableKey });
  return screen.findByTestId('variable-detail-error');
}

async function renderRejection(reason: unknown) {
  vi.mocked(getConceptDetails).mockRejectedValue(reason);
  render(VariableDetail, { section: mockState.section, variableKey });
  return screen.findByTestId('variable-detail-error');
}

describe('VariableDetail', () => {
  beforeEach(() => {
    cleanup();
    vi.mocked(getConceptDetails).mockReset();
    vi.mocked(getHierarchyConcepts).mockReset();
    vi.mocked(log).mockClear();
    mockState.pathname = '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
    mockState.section = 'explorer';
    mockState.enableHierarchy = false;
    mockState.exportsEnableExport = true;
    mockState.loggedIn = true;
    // Both stores are module state, so they survive between tests in this file exactly as
    // they survive a navigation in the app.
    clearExports();
    clearFilters();
    searchTerm.set('');
  });

  it('looks the variable up by the key the route decoded', async () => {
    await renderDetail();
    expect(getConceptDetails).toHaveBeenCalledWith('\\this\\is\\a\\age\\', 'test_data_set');
  });

  describe('the identity block', () => {
    it('is the name in bold, the study beneath it and a type badge', async () => {
      await renderDetail();

      const name = screen.getByTestId('variable-detail-name');
      expect(name).toHaveTextContent('Age at exam');
      expect(name).toHaveClass('font-bold');
      expect(screen.getByTestId('variable-detail-study')).toHaveTextContent('TDS');
      expect(screen.getByTestId('variable-detail-type')).toHaveTextContent('Continuous');
    });

    it('falls back to the accession when the variable has no display name', async () => {
      await renderDetail({ display: '' });
      expect(screen.getByTestId('variable-detail-name')).toHaveTextContent('age1');
    });

    // The card's rule, and the same fallback: an absent acronym leaves the study ref.
    it('falls back to the dataset when the study has no acronym', async () => {
      await renderDetail({ studyAcronym: '' });
      expect(screen.getByTestId('variable-detail-study')).toHaveTextContent('test_data_set');
    });
  });

  // This is the one page in the feature designed to be shared, so its tab, history entry and
  // bookmark have to say which variable rather than only which section.
  describe('Back to Search Results', () => {
    it('is a link to the section root', async () => {
      await renderDetail();

      const back = screen.getByTestId('variable-detail-back');
      expect(back.tagName).toBe('A');
      expect(back).toHaveAttribute('href', '/explorer');
    });

    it('returns to Discover from a Discover detail page', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      mockState.section = 'discover';
      await renderDetail();
      expect(screen.getByTestId('variable-detail-back')).toHaveAttribute('href', '/discover');
    });
  });

  describe('sections', () => {
    it('renders Variable Information', async () => {
      await renderDetail();
      expect(screen.getByTestId('variable-detail-information')).toBeInTheDocument();
      expect(await screen.findByTestId('variable-info')).toBeInTheDocument();
    });

    it('omits the hierarchy when the deployment has it turned off', async () => {
      await renderDetail();
      expect(screen.queryByTestId('variable-detail-hierarchy')).not.toBeInTheDocument();
      expect(getHierarchyConcepts).not.toHaveBeenCalled();
    });

    it('renders the hierarchy when the deployment has it turned on', async () => {
      mockState.enableHierarchy = true;
      vi.mocked(getHierarchyConcepts).mockResolvedValue([detail]);
      await renderDetail();

      expect(screen.getByTestId('variable-detail-hierarchy')).toBeInTheDocument();
      expect(await screen.findByTestId('hierarchy-component')).toBeInTheDocument();
      expect(getHierarchyConcepts).toHaveBeenCalledWith('test_data_set', '\\this\\is\\a\\age\\');
    });
  });
  // Blank, not crashing, is the failure mode to avoid: the user has no way to tell a broken
  // link from a broken app, and no way back either.
  describe('errors', () => {
    it('explains a key that addresses nothing, and still offers a way back', async () => {
      render(VariableDetail, { section: 'explorer' });

      expect(await screen.findByTestId('variable-detail-error')).toHaveTextContent(
        'We could not read that variable link',
      );
      expect(screen.getByTestId('variable-detail-back')).toBeInTheDocument();
      expect(getConceptDetails).not.toHaveBeenCalled();
    });

    it('explains a variable the dictionary does not know', async () => {
      expect(await renderRejection(new Error('No response'))).toHaveTextContent(
        'We could not find that variable',
      );
      expect(screen.getByTestId('variable-detail-back')).toBeInTheDocument();
    });

    // A 200 is not proof of a concept. Rendering one of these would give an empty heading
    // over an information card that cannot load.
    it('reads an empty object as the dictionary holding nothing for the key', async () => {
      expect(await renderResponse({})).toHaveTextContent('We could not find that variable');
      expect(screen.queryByTestId('variable-identity')).not.toBeInTheDocument();
    });

    it('reads a concept missing its dataset as holding nothing for the key', async () => {
      expect(await renderResponse({ conceptPath: '\\a\\b\\' })).toHaveTextContent(
        'We could not find that variable',
      );
    });

    it('renders no identity, information or hierarchy alongside an error', async () => {
      mockState.enableHierarchy = true;
      await renderRejection(new Error('No response'));

      expect(screen.queryByTestId('variable-identity')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-information')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-hierarchy')).not.toBeInTheDocument();
      expect(getHierarchyConcepts).not.toHaveBeenCalled();
    });
  });
});
