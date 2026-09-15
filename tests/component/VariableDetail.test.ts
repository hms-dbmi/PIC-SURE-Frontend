// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';

const mockState = vi.hoisted(() => ({
  pathname: '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
  enableHierarchy: false,
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
      return { explorer: { enableHierarchy: mockState.enableHierarchy } };
    },
    branding: { explorePage: { resultInfo: {} } },
  },
  resetConfig: () => {},
}));

import VariableDetail from '$lib/components/explorer/VariableDetail.svelte';
import { getConceptDetails, getHierarchyConcepts } from '$lib/stores/Dictionary';
import { searchTerm } from '$lib/stores/Search';
import type { SearchResult } from '$lib/models/Search';
import type { VariableKey } from '$lib/explorer/variableUrl';

vi.mock('$lib/stores/Dictionary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/Dictionary')>()),
  getConceptDetails: vi.fn(),
  getHierarchyConcepts: vi.fn(),
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
  render(VariableDetail, { variableKey });
  await screen.findByTestId('variable-identity');
}

describe('VariableDetail', () => {
  beforeEach(() => {
    cleanup();
    vi.mocked(getConceptDetails).mockReset();
    vi.mocked(getHierarchyConcepts).mockReset();
    mockState.pathname = '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
    mockState.enableHierarchy = false;
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

  describe('Back to Search Results', () => {
    it('is a link to the section root, carrying the active search', async () => {
      searchTerm.set('age at exam');
      await renderDetail();

      const back = screen.getByTestId('variable-detail-back');
      expect(back.tagName).toBe('A');
      expect(back).toHaveAttribute('href', '/explorer?search=age%20at%20exam');
    });

    it('is the bare section root when there is no search to return to', async () => {
      await renderDetail();
      expect(screen.getByTestId('variable-detail-back')).toHaveAttribute('href', '/explorer');
    });

    it('returns to Discover from a Discover detail page', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      searchTerm.set('age');
      await renderDetail();
      expect(screen.getByTestId('variable-detail-back')).toHaveAttribute(
        'href',
        '/discover?search=age',
      );
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
      render(VariableDetail, {});

      expect(await screen.findByTestId('variable-detail-error')).toHaveTextContent(
        'We could not read that variable link',
      );
      expect(screen.getByTestId('variable-detail-back')).toBeInTheDocument();
      expect(getConceptDetails).not.toHaveBeenCalled();
    });

    it('explains a key the dictionary does not know', async () => {
      vi.mocked(getConceptDetails).mockRejectedValue(new Error('No response'));
      render(VariableDetail, { variableKey });

      expect(await screen.findByTestId('variable-detail-error')).toHaveTextContent(
        'We could not find that variable',
      );
      expect(screen.getByTestId('variable-detail-back')).toBeInTheDocument();
    });
  });
});
