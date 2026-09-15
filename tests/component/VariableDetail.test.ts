// @vitest-environment happy-dom

import { error } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';

const mockState = vi.hoisted(() => ({
  // HierarchyComponent reads the pathname to decide whether filtering is allowed; the page
  // itself is told its section rather than inferring one.
  pathname: '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
  section: 'explorer' as 'explorer' | 'discover',
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
    branding: { applicationName: 'PIC-SURE', explorePage: { resultInfo: {} } },
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
  render(VariableDetail, { section: mockState.section, variableKey });
  await screen.findByTestId('variable-identity');
}

/** Renders with a dictionary that answers `response`, however unlike a concept it is. */
async function renderResponse(response: unknown) {
  vi.mocked(getConceptDetails).mockResolvedValue(response as SearchResult);
  render(VariableDetail, { section: mockState.section, variableKey });
  return screen.findByTestId('variable-detail-error');
}

/**
 * `error()` throws in SvelteKit 2 rather than returning, so this catches it to get the real
 * `HttpError` as a value - which is what `isHttpError` needs to recognise a 404, and what
 * `api.ts` throws via its own `fail()`.
 */
function httpError(status: number, message: string): unknown {
  try {
    error(status as 404, message);
  } catch (thrown) {
    return thrown;
  }
  throw new Error('error() unexpectedly did not throw');
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
    mockState.pathname = '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
    mockState.section = 'explorer';
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

  // This is the one page in the feature designed to be shared, so its tab, history entry and
  // bookmark have to say which variable rather than only which section.
  describe('the document title', () => {
    it('names the variable once it has loaded', async () => {
      await renderDetail();
      expect(document.title).toBe('PIC-SURE | Age at exam');
    });

    it('names the section before then, and when there is nothing to name', async () => {
      await renderRejection(httpError(404, 'not found'));
      expect(document.title).toBe('PIC-SURE | Explorer');
    });

    it('names Discover on a Discover detail page', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      mockState.section = 'discover';
      await renderRejection(httpError(404, 'not found'));
      expect(document.title).toBe('PIC-SURE | Discover');
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
      mockState.section = 'discover';
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
  // link from a broken app, and no way back either. The copy has to tell them apart too, or
  // an outage reads to every user as their own link being stale.
  describe('errors', () => {
    it('explains a key that addresses nothing, and still offers a way back', async () => {
      render(VariableDetail, { section: 'explorer' });

      expect(await screen.findByTestId('variable-detail-error')).toHaveTextContent(
        'We could not read that variable link',
      );
      expect(screen.getByTestId('variable-detail-back')).toBeInTheDocument();
      expect(getConceptDetails).not.toHaveBeenCalled();
    });

    it('reads a 404 as a stale link', async () => {
      expect(await renderRejection(httpError(404, 'not found'))).toHaveTextContent(
        'We could not find that variable',
      );
    });

    it.each([
      { case: 'a dictionary 500', reason: httpError(500, 'boom') },
      { case: 'a gateway timeout', reason: httpError(504, 'timeout') },
      { case: 'a forbidden response', reason: httpError(403, 'no') },
      { case: 'an empty body', reason: new Error('No response') },
      { case: 'a network failure', reason: new TypeError('Failed to fetch') },
    ])('reads $case as a service problem, not a stale link', async ({ reason }) => {
      const alert = await renderRejection(reason);
      expect(alert).toHaveTextContent('We could not load that variable');
      expect(alert).toHaveTextContent('contact an administrator');
      expect(alert).not.toHaveTextContent('since the link was made');
    });

    // A 200 is not proof of a concept. Rendering one of these gave an empty heading and
    // handed ResultInfoComponent a result with no concept path, whose own {#await} has no
    // catch - a card that spins forever.
    it('reads an empty object as the dictionary holding nothing for the key', async () => {
      expect(await renderResponse({})).toHaveTextContent('We could not find that variable');
      expect(screen.queryByTestId('variable-identity')).not.toBeInTheDocument();
    });

    it('reads a concept missing its dataset as holding nothing for the key', async () => {
      expect(await renderResponse({ conceptPath: '\\a\\b\\' })).toHaveTextContent(
        'We could not find that variable',
      );
    });

    it.each([
      { case: 'a proxy interstitial', response: '<html>Access Denied</html>' },
      { case: 'an empty string body', response: '' },
      { case: 'nothing at all', response: undefined },
    ])('reads $case as a service problem', async ({ response }) => {
      expect(await renderResponse(response)).toHaveTextContent('We could not load that variable');
    });

    it('renders no identity, information or hierarchy alongside an error', async () => {
      mockState.enableHierarchy = true;
      await renderRejection(httpError(500, 'boom'));

      expect(screen.queryByTestId('variable-identity')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-information')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-hierarchy')).not.toBeInTheDocument();
      expect(getHierarchyConcepts).not.toHaveBeenCalled();
    });
  });
});
