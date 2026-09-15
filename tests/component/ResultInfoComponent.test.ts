// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';
import { config } from '$lib/configuration.svelte';
import { getConceptDetails } from '$lib/stores/Dictionary';
import type { SearchResult } from '$lib/models/Search';

vi.mock('$lib/stores/Dictionary', () => ({
  getConceptDetails: vi.fn(),
}));

const mockGetConceptDetails = vi.mocked(getConceptDetails);

const data = {
  conceptPath: '\\test\\concept\\',
  dataset: 'dataset-1',
} as SearchResult;

// The mockups' own variable, so the labels, the values and the order under test are the
// design's rather than ones invented here: `p1-04-asthma-detail.png`, and the data behind it
// in `clickable-prototype-2/prototype/js/data.js`.
const HARMONIZATION_URL =
  'https://github.com/RTIInternational/NHLBI-BDC-DMC-HV/tree/main/priority_variables_transform';

const ASTHMA_META = {
  Accession: 'MONDO:004979',
  'Subject Type': 'Human',
  Vocabulary: 'Mondo Disease Ontology',
  'Harmonization method(s)': HARMONIZATION_URL,
};

// The rows p1-04 shows, top to bottom. p1-10 adds Unit between Type and Subject Type.
const MOCKUP_ROW_ORDER = [
  'variable-info-name',
  'variable-info-description',
  'variable-info-accession',
  'variable-info-type',
  'variable-info-subject-type',
  'variable-info-vocabulary',
  'variable-info-harmonization-methods',
];

function makeDetail(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    conceptPath: '\\test\\concept\\',
    dataset: 'dataset-1',
    name: 'asthma',
    display: 'asthma',
    studyAcronym: 'Root Study Acronym',
    description: 'A bronchial disease characterized by chronic inflammation of the airways.',
    type: 'Categorical',
    allowFiltering: true,
    meta: { ...ASTHMA_META },
    table: {
      conceptPath: '\\test\\table\\',
      dataset: 'dataset-1',
      name: 'dataset-accession',
      display: 'Dataset Display',
      studyAcronym: '',
      description: 'Dataset description',
      type: 'AnyRecordOf',
      allowFiltering: false,
    },
    study: {
      conceptPath: '\\test\\study\\',
      dataset: 'dataset-1',
      name: 'study-name',
      display: 'Study Display',
      studyAcronym: 'Study Acronym',
      fullName: 'Study Full Name',
      ref: 'study-accession',
      description: '',
      type: 'AnyRecordOf',
      allowFiltering: false,
    } as SearchResult,
    ...overrides,
  };
}

async function renderResultInfo(detail: SearchResult) {
  mockGetConceptDetails.mockResolvedValue(detail);
  render(ResultInfoComponent, { data });
  await screen.findByTestId('variable-info');
}

/** The variable list's rows, in document order, by the id the e2e suite reads them with. */
function variableRowIds(): (string | null)[] {
  return Array.from(
    screen.getByTestId('variable-info').querySelectorAll('[data-testid^="variable-info-"]'),
  ).map((row) => row.getAttribute('data-testid'));
}

describe('ResultInfoComponent', () => {
  beforeEach(() => {
    mockGetConceptDetails.mockReset();
    config.branding.explorePage.resultInfo = {
      variableHeader: 'Variable Information',
      datasetHeader: 'Dataset Information',
      studyHeader: 'Study Information',
    };
  });

  describe('Variable Information', () => {
    it("renders the mockup's rows, in the mockup's order, with the mockup's labels", async () => {
      await renderResultInfo(makeDetail());

      expect(variableRowIds()).toEqual(MOCKUP_ROW_ORDER);
      expect(screen.getByTestId('variable-info-name')).toHaveTextContent('Name: asthma');
      expect(screen.getByTestId('variable-info-description')).toHaveTextContent(
        'Description: A bronchial disease characterized by chronic inflammation of the airways.',
      );
      expect(screen.getByTestId('variable-info-accession')).toHaveTextContent(
        'Accession: MONDO:004979',
      );
      expect(screen.getByTestId('variable-info-type')).toHaveTextContent('Type: Categorical');
      expect(screen.getByTestId('variable-info-subject-type')).toHaveTextContent(
        'Subject Type: Human',
      );
      expect(screen.getByTestId('variable-info-vocabulary')).toHaveTextContent(
        'Vocabulary: Mondo Disease Ontology',
      );
      expect(screen.getByTestId('variable-info-harmonization-methods')).toHaveTextContent(
        `Harmonization method(s): ${HARMONIZATION_URL}`,
      );
    });

    // p1-10-eosinophil-detail.png, the continuous variable. `unit` is a real dictionary meta
    // key - one of the nine the dictionary's own search whitelists.
    it('renders Unit after Type when the variable carries one', async () => {
      await renderResultInfo(
        makeDetail({
          meta: { ...ASTHMA_META, Unit: '10*3/uL' },
        }),
      );

      expect(variableRowIds()).toEqual([
        'variable-info-name',
        'variable-info-description',
        'variable-info-accession',
        'variable-info-type',
        'variable-info-unit',
        'variable-info-subject-type',
        'variable-info-vocabulary',
        'variable-info-harmonization-methods',
      ]);
      expect(screen.getByTestId('variable-info-unit')).toHaveTextContent('Unit: 10*3/uL');
    });

    it('renders Harmonization method(s) as a link to the transform', async () => {
      await renderResultInfo(makeDetail());

      const link = screen.getByRole('link', { name: HARMONIZATION_URL });
      expect(link).toHaveAttribute('href', HARMONIZATION_URL);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    // `meta` is dictionary data, and this row's value becomes an href. A `javascript:` value
    // would otherwise be one click from running in the user's session.
    it.each([
      { case: 'a javascript: url', value: 'javascript:alert(document.cookie)' },
      { case: 'a data: url', value: 'data:text/html,<script>alert(1)</script>' },
      { case: 'text that is not a url at all', value: 'see the harmonization repository' },
    ])('renders $case as text rather than a link', async ({ value }) => {
      await renderResultInfo(makeDetail({ meta: { 'Harmonization method(s)': value } }));

      const row = screen.getByTestId('variable-info-harmonization-methods');
      expect(row).toHaveTextContent(`Harmonization method(s): ${value}`);
      expect(row.querySelector('a')).toBeNull();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    /**
     * The four fields the design asks for live in the free-form `meta` bag, whose keys are
     * filled per deployment: the dictionary's own seed data mixes `snake_case`,
     * `space separated` and mixed case, and its search whitelists `Question` *and* `question`.
     * So the key is matched with case and punctuation removed.
     */
    it.each([
      {
        case: 'Title Case with spaces',
        meta: {
          Accession: 'MONDO:004979',
          'Subject Type': 'Human',
          Vocabulary: 'Mondo Disease Ontology',
          'Harmonization method(s)': HARMONIZATION_URL,
        },
      },
      {
        case: 'snake_case',
        meta: {
          accession: 'MONDO:004979',
          subject_type: 'Human',
          vocabulary: 'Mondo Disease Ontology',
          harmonization_methods: HARMONIZATION_URL,
        },
      },
      {
        case: 'camelCase, and a singular harmonization key',
        meta: {
          accession: 'MONDO:004979',
          subjectType: 'Human',
          vocabulary: 'Mondo Disease Ontology',
          harmonizationMethod: HARMONIZATION_URL,
        },
      },
      {
        case: "UPPER_SNAKE, and the prototype's harmonizationLink",
        meta: {
          ACCESSION: 'MONDO:004979',
          SUBJECT_TYPE: 'Human',
          VOCABULARY: 'Mondo Disease Ontology',
          harmonizationLink: HARMONIZATION_URL,
        },
      },
    ])('reads the meta keys as $case', async ({ meta }) => {
      await renderResultInfo(makeDetail({ meta }));

      expect(variableRowIds()).toEqual(MOCKUP_ROW_ORDER);
      expect(screen.getByTestId('variable-info-accession')).toHaveTextContent(
        'Accession: MONDO:004979',
      );
      expect(screen.getByTestId('variable-info-subject-type')).toHaveTextContent(
        'Subject Type: Human',
      );
      expect(screen.getByTestId('variable-info-vocabulary')).toHaveTextContent(
        'Vocabulary: Mondo Disease Ontology',
      );
      expect(screen.getByRole('link', { name: HARMONIZATION_URL })).toBeInTheDocument();
    });

    /**
     * What every deployment we can see actually sends. None of the fixtures, none of
     * `mock-data.ts` and none of the dictionary's seed data carries Accession, Subject Type,
     * Vocabulary or Harmonization method(s); the keys they do carry are these.
     */
    it('renders Name, Description and Type for a variable carrying none of those keys', async () => {
      await renderResultInfo(
        makeDetail({
          meta: {
            values: ['Yes', 'No'],
            description: 'A second copy of the description',
            stigmatized: false,
            unique_identifier: 'false',
            free_text: 'false',
          },
        }),
      );

      expect(variableRowIds()).toEqual([
        'variable-info-name',
        'variable-info-description',
        'variable-info-type',
      ]);
      // The bag is no longer appended to the list: these were rows of their own before.
      expect(screen.getByTestId('variable-info')).not.toHaveTextContent('values:');
      expect(screen.getByTestId('variable-info')).not.toHaveTextContent('stigmatized:');
      expect(screen.getByTestId('variable-info')).not.toHaveTextContent('unique_identifier:');
    });

    it.each([
      { case: 'no meta at all', meta: undefined },
      { case: 'a null meta bag', meta: null },
      { case: 'an empty meta bag', meta: {} },
    ])('renders Name, Description and Type with $case', async ({ meta }) => {
      await renderResultInfo(makeDetail({ meta }));

      expect(variableRowIds()).toEqual([
        'variable-info-name',
        'variable-info-description',
        'variable-info-type',
      ]);
    });

    // A label with nothing after it reads as missing data rather than as an absent field.
    it('omits a field with no value rather than rendering an empty row', async () => {
      await renderResultInfo(
        makeDetail({
          display: '',
          description: null,
          type: undefined,
          meta: {
            Accession: '',
            'Subject Type': null,
            Vocabulary: undefined,
            'Harmonization method(s)': '',
          },
          table: null,
          study: null,
        } as Partial<SearchResult>),
      );

      expect(variableRowIds()).toEqual([]);
      // No label survives, so nothing in the section but its heading - which has no colon.
      expect(screen.getByTestId('variable-info')).not.toHaveTextContent(':');
    });

    // The old list's Accession row was `name`, which the dictionary documents as "the right
    // most concept in the concept path" - a path segment, not an accession. The design's
    // accessions are ontology identifiers (MONDO:, OBA:), so the two are not the same field
    // and the path segment is not shown under that label.
    it('does not label the concept path segment as an Accession', async () => {
      await renderResultInfo(
        makeDetail({ name: 'heart_test', meta: {}, table: null, study: null }),
      );

      expect(screen.queryByTestId('variable-info-accession')).not.toBeInTheDocument();
      expect(screen.getByTestId('variable-info')).not.toHaveTextContent('heart_test');
    });
  });

  describe('Dataset and Study Information', () => {
    it('renders configured section headers when the matching sections are present', async () => {
      config.branding.explorePage.resultInfo = {
        variableHeader: 'Custom Variable Header',
        datasetHeader: 'Custom Dataset Header',
        studyHeader: 'Custom Study Header',
      };

      await renderResultInfo(makeDetail());

      expect(screen.getByText('Custom Variable Header')).toBeInTheDocument();
      expect(screen.getByText('Custom Dataset Header')).toBeInTheDocument();
      expect(screen.getByText('Custom Study Header')).toBeInTheDocument();
    });

    it('renders all populated dataset and study fields', async () => {
      await renderResultInfo(makeDetail());

      expect(screen.getByTestId('dataset-info')).toHaveTextContent('Name: Dataset Display');
      expect(screen.getByTestId('dataset-info')).toHaveTextContent('Accession: dataset-accession');
      expect(screen.getByTestId('dataset-info')).toHaveTextContent(
        'Description: Dataset description',
      );
      expect(screen.getByTestId('study-info')).toHaveTextContent('Study Name: Study Full Name');
      expect(screen.getByTestId('study-info')).toHaveTextContent(
        'Study Accession: study-accession',
      );
    });

    it('does not render dataset or study sections when those objects are missing', async () => {
      await renderResultInfo(makeDetail({ table: null, study: null }));

      expect(screen.getByTestId('variable-info')).toBeInTheDocument();
      expect(screen.queryByTestId('dataset-info')).not.toBeInTheDocument();
      expect(screen.queryByText('Dataset Information')).not.toBeInTheDocument();
      expect(screen.queryByTestId('study-info')).not.toBeInTheDocument();
      expect(screen.queryByText('Study Information')).not.toBeInTheDocument();
    });

    it('does not render dataset or study field labels for missing values', async () => {
      await renderResultInfo(
        makeDetail({
          table: {
            ...makeDetail().table,
            display: '',
            name: '',
            description: '',
          } as SearchResult,
          study: {
            ...makeDetail().study,
            fullName: '',
            display: '',
            studyAcronym: '',
            ref: '',
          } as SearchResult,
          studyAcronym: '',
        } as Partial<SearchResult>),
      );

      expect(screen.getByTestId('dataset-info')).not.toHaveTextContent(':');
      expect(screen.getByTestId('study-info')).not.toHaveTextContent(':');
    });

    it.each([
      [{ fullName: 'Full Name', display: 'Display', studyAcronym: 'Acronym' }, 'Full Name'],
      [{ fullName: '', display: 'Display', studyAcronym: 'Acronym' }, 'Display'],
      [{ fullName: '', display: '', studyAcronym: 'Acronym' }, 'Acronym'],
    ])('renders study name using study fallback %#', async (studyOverrides, expectedStudyName) => {
      await renderResultInfo(
        makeDetail({
          study: {
            ...makeDetail().study,
            ...studyOverrides,
          } as SearchResult,
        }),
      );

      expect(screen.getByTestId('study-info')).toHaveTextContent(
        `Study Name: ${expectedStudyName}`,
      );
    });

    it('falls back to the root study acronym when study name fields are missing', async () => {
      await renderResultInfo(
        makeDetail({
          studyAcronym: 'Root Acronym',
          study: {
            ...makeDetail().study,
            fullName: '',
            display: '',
            studyAcronym: '',
          } as SearchResult,
        }),
      );

      expect(screen.getByTestId('study-info')).toHaveTextContent('Study Name: Root Acronym');
    });

    // Dataset and Study keep their `meta` bags: a study's link, phase and accession are on
    // screen nowhere else.
    it('renders dataset and study meta key-value pairs in their own sections', async () => {
      await renderResultInfo(
        makeDetail({
          table: {
            ...makeDetail().table,
            meta: { dataType: 'Dataset Type' },
          } as SearchResult,
          study: {
            ...makeDetail().study,
            meta: { study_link: 'http://www.picsure.org/', phase: 'p1' },
          } as SearchResult,
        }),
      );

      expect(screen.getByTestId('dataset-info')).toHaveTextContent('dataType: Dataset Type');
      expect(screen.getByTestId('study-info')).toHaveTextContent(
        'study_link: http://www.picsure.org/',
      );
      expect(screen.getByTestId('study-info')).toHaveTextContent('phase: p1');
    });

    it('formats array and object meta values safely', async () => {
      await renderResultInfo(
        makeDetail({
          table: {
            ...makeDetail().table,
            meta: {
              arrayValue: ['one', 'two'],
              objectValue: { nested: 'value' },
            },
          } as unknown as SearchResult,
        }),
      );

      expect(screen.getByTestId('dataset-info')).toHaveTextContent('arrayValue: one, two');
      expect(screen.getByTestId('dataset-info')).toHaveTextContent(
        'objectValue: {"nested":"value"}',
      );
    });

    it('shows the first 10 study rows and toggles the rest with show more', async () => {
      await renderResultInfo(
        makeDetail({
          study: {
            ...makeDetail().study,
            meta: Object.fromEntries(
              Array.from({ length: 9 }, (_, index) => [`meta ${index + 1}`, `value ${index + 1}`]),
            ),
          } as SearchResult,
        }),
      );

      // Study Name and Study Accession, then eight of the nine meta rows.
      const studyInfo = screen.getByTestId('study-info');
      expect(studyInfo).toHaveTextContent('Study Name: Study Full Name');
      expect(studyInfo).toHaveTextContent('meta 8: value 8');
      expect(studyInfo).not.toHaveTextContent('meta 9: value 9');

      const showMoreButton = screen.getByTestId('show-more-study-info');
      expect(showMoreButton).toHaveTextContent('Show More');

      await fireEvent.click(showMoreButton);

      expect(studyInfo).toHaveTextContent('meta 9: value 9');
      expect(showMoreButton).toHaveTextContent('Show Less');
    });
  });

  describe('when the lookup fails', () => {
    it('reports the failure instead of spinning for good', async () => {
      mockGetConceptDetails.mockRejectedValue(new Error('boom'));

      render(ResultInfoComponent, { data });

      expect(await screen.findByTestId('variable-info-error')).toHaveTextContent(
        "We could not load this variable's information",
      );
      expect(screen.queryByTestId('progress-ring')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-info')).not.toBeInTheDocument();
    });

    /**
     * The way this actually happened, rather than a synthetic rejection: a caller that holds a
     * concept with no path - a `200` carrying `{}`, or a non-JSON interstitial resolved
     * through `getConceptDetails` - renders this component with it, and
     * `getConceptDetails(undefined, undefined)` throws inside its own `conceptPath.replace`.
     * The mock does only what the real function's first statements do with its arguments.
     */
    it('reports a concept with no path, which is what the callers can still hand it', async () => {
      mockGetConceptDetails.mockImplementation(async (conceptPath: string, dataset: string) => {
        return { conceptPath: conceptPath.replace(/\\\\/g, '\\'), dataset } as SearchResult;
      });

      render(ResultInfoComponent, { data: {} as SearchResult });

      expect(await screen.findByTestId('variable-info-error')).toBeInTheDocument();
      expect(screen.queryByTestId('progress-ring')).not.toBeInTheDocument();
    });
  });
});
