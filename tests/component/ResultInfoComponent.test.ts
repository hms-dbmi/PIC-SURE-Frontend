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

/**
 * The dictionary's own canonical dbGaP variable, `seed.sql` concept_node 232, verbatim.
 *
 * It is the fixture that can tell `name`, `display` and the last segment of the concept path
 * apart: `name` is `phv00004260` - the dbGaP variable accession - while `display` *and* the
 * last path segment are both `FM219`. Every other fixture here has `name === display`, so
 * none of them can distinguish which field an Accession row was read from.
 */
const DBGAP_VARIABLE = {
  conceptPath: '\\phs000007\\pht000022\\phv00004260\\FM219\\',
  name: 'phv00004260',
  display: 'FM219',
};

/**
 * The meta keys the dictionary indexes for search, as it spells them -
 * `WeightUpdateCreator`, mirrored into `db/dml/rebuild_searchable_fields.sql`. It is the best
 * available statement of which keys deployments actually populate, so the coverage below is
 * generated from it rather than from a list written out here a second time.
 *
 * `ConceptMetaExtractor` title-cases each `_`-delimited word on the way out, so a deployment's
 * `derived_values` reaches this component as `Derived Values`; the raw spellings are used here
 * because the component must not depend on which of the two it gets.
 */
const INDEXED_META_KEYS = [
  'description',
  'derived_values',
  'variable_type',
  'comment',
  'domain',
  'Question',
  'question',
  'unit',
  'values',
];

/** The only indexed key one of the designed rows reads, so the only one the bag must not repeat. */
const INDEXED_KEYS_A_DESIGNED_ROW_READS = ['unit'];

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function sectionText(testid: string): string {
  return screen.getByTestId(testid).textContent ?? '';
}

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
      // Seven rows fit, so there is nothing to reveal.
      expect(screen.queryByTestId('show-more-variable-info')).not.toBeInTheDocument();
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

    /**
     * `meta` is dictionary data, and this row's value becomes an `href`. A `javascript:` value
     * would otherwise be one click from running in the user's session.
     *
     * `safeLink` parses with `new URL` and allows only `http:`/`https:`, which handles all of
     * these - the parser lowercases the scheme, strips ASCII whitespace including embedded
     * tabs and newlines, trims C0 and space, and throws on a protocol-relative URL with no
     * base. The table is wide because the boundary is a security one: a refactor to something
     * like `value.startsWith('http')` still passes a three-row table covering only lowercase
     * `javascript:`, `data:` and plain text, while regressing every other row here.
     */
    it.each([
      { case: 'a javascript: url', value: 'javascript:alert(document.cookie)' },
      { case: 'JavaScript: in mixed case', value: 'JavaScript:alert(document.cookie)' },
      { case: 'JAVASCRIPT: in upper case', value: 'JAVASCRIPT:alert(document.cookie)' },
      { case: 'a javascript: url padded with whitespace', value: '  javascript:alert(1)\n' },
      { case: 'a tab smuggled into the scheme', value: 'java\tscript:alert(1)' },
      { case: 'a newline smuggled into the scheme', value: 'java\nscript:alert(1)' },
      { case: 'a carriage return smuggled into the scheme', value: 'java\rscript:alert(1)' },
      { case: 'a data: url', value: 'data:text/html,<script>alert(1)</script>' },
      { case: 'a vbscript: url', value: 'vbscript:msgbox(1)' },
      { case: 'a file: url', value: 'file:///etc/passwd' },
      { case: 'a protocol-relative url', value: '//evil.com/harmonization' },
      { case: 'text that is not a url at all', value: 'see the harmonization repository' },
      { case: 'a bare hostname with no scheme', value: 'evil.com/harmonization' },
    ])('renders $case as text rather than a link', async ({ value }) => {
      await renderResultInfo(makeDetail({ meta: { 'Harmonization method(s)': value } }));

      const row = screen.getByTestId('variable-info-harmonization-methods');
      // `textContent` rather than `toHaveTextContent`, which collapses the whitespace that
      // several of these values are entirely about.
      expect(row).toHaveTextContent('Harmonization method(s):');
      expect(row.textContent).toContain(value);
      expect(row.querySelector('a')).toBeNull();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    // The other direction: the two schemes that must survive, so the rule above cannot be
    // satisfied by rejecting everything.
    it.each([
      { case: 'https', value: 'https://example.org/harmonization' },
      { case: 'http', value: 'http://example.org/harmonization' },
      { case: 'https in mixed case, which the parser normalises', value: 'HtTpS://example.org/h' },
    ])('renders an $case url as a link', async ({ value }) => {
      await renderResultInfo(makeDetail({ meta: { 'Harmonization method(s)': value } }));

      const link = screen.getByTestId('variable-info-harmonization-methods').querySelector('a');
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute('href', value);
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
     * `mock-data.ts` and none of the dictionary's seed data carries Subject Type, Vocabulary
     * or Harmonization method(s); the keys they do carry are these. Accession still renders,
     * from `name`.
     */
    it('renders the designed rows a variable has values for, and keeps the rest of its bag', async () => {
      await renderResultInfo(
        makeDetail({
          ...DBGAP_VARIABLE,
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
        'variable-info-accession',
        'variable-info-type',
      ]);
      // And the bag below them, which this component is the only renderer of.
      const variableInfo = screen.getByTestId('variable-info');
      expect(variableInfo).toHaveTextContent('values: Yes, No');
      expect(variableInfo).toHaveTextContent('stigmatized: false');
      expect(variableInfo).toHaveTextContent('unique_identifier: false');
      expect(variableInfo).toHaveTextContent('free_text: false');
    });

    it.each([
      { case: 'no meta at all', meta: undefined },
      { case: 'a null meta bag', meta: null },
      { case: 'an empty meta bag', meta: {} },
    ])('renders Name, Description, Accession and Type with $case', async ({ meta }) => {
      await renderResultInfo(makeDetail({ ...DBGAP_VARIABLE, meta }));

      expect(variableRowIds()).toEqual([
        'variable-info-name',
        'variable-info-description',
        'variable-info-accession',
        'variable-info-type',
      ]);
      expect(screen.getByTestId('variable-info-accession')).toHaveTextContent(
        'Accession: phv00004260',
      );
    });

    // A label with nothing after it reads as missing data rather than as an absent field.
    it('omits a field with no value rather than rendering an empty row', async () => {
      await renderResultInfo(
        makeDetail({
          display: '',
          name: '',
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

    /**
     * Accession falls back to `name`, which is the row this page showed before the redesign.
     *
     * `Concept.java` documents `name` as "the right most concept in the concept path", and
     * that JavaDoc is wrong about the data: `name` and `concept_path` are independent columns,
     * `ConceptResultSetUtil` maps `name` verbatim, and of the dictionary's own 92 seed
     * concept nodes only 28 have `name` equal to the last path segment. On concept_node 232 -
     * the fixture below - `name` is the dbGaP variable accession `phv00004260` while the last
     * segment is `FM219`, so dropping this row hid the identifier users cite and showed
     * nothing in its place, `meta.Accession` existing in no deployment, fixture or seed row.
     */
    it('falls back to name for the Accession, which is the dbGaP variable accession', async () => {
      await renderResultInfo(makeDetail({ ...DBGAP_VARIABLE, meta: {}, table: null, study: null }));

      // `phv00004260`, not `FM219` - which is both `display` and the last path segment.
      expect(screen.getByTestId('variable-info-accession')).toHaveTextContent(
        'Accession: phv00004260',
      );
      expect(screen.getByTestId('variable-info-name')).toHaveTextContent('Name: FM219');
    });

    it('prefers a meta accession over name when the bag carries one', async () => {
      await renderResultInfo(
        makeDetail({
          ...DBGAP_VARIABLE,
          meta: { Accession: 'MONDO:004979' },
          table: null,
          study: null,
        }),
      );

      expect(screen.getByTestId('variable-info-accession')).toHaveTextContent(
        'Accession: MONDO:004979',
      );
      expect(sectionText('variable-info')).not.toContain('phv00004260');
    });

    // An empty key is not an accession. Reading the bag first must not mean reading `''` and
    // rendering the row blank, which is how the row reads as missing data.
    it('falls back to name when the meta accession is present but empty', async () => {
      await renderResultInfo(
        makeDetail({ ...DBGAP_VARIABLE, meta: { Accession: '' }, table: null, study: null }),
      );

      expect(screen.getByTestId('variable-info-accession')).toHaveTextContent(
        'Accession: phv00004260',
      );
    });
  });

  /**
   * The concept's own `meta` bag, which the designed rows sit above rather than replace.
   *
   * The dictionary already decides what to hide, server side and per deployment, with the
   * `metadata.no_show_list` denylist `ConceptRepository` applies as `key NOT IN (:noShowList)`.
   * What arrives here is what that deployment wants shown, and this component is the only
   * renderer of a concept's bag in the application, so a key omitted here renders nowhere.
   */
  describe("the variable's meta bag", () => {
    it('renders every key the dictionary indexes that no designed row already shows', async () => {
      const meta = Object.fromEntries(INDEXED_META_KEYS.map((key) => [key, `value of ${key}`]));
      await renderResultInfo(makeDetail({ ...DBGAP_VARIABLE, meta, table: null, study: null }));

      // Nine bag keys behind four designed rows overruns the ten-row window, so reveal the
      // tail before asserting on it.
      await fireEvent.click(screen.getByTestId('show-more-variable-info'));

      const variableInfo = screen.getByTestId('variable-info');
      INDEXED_META_KEYS.filter((key) => !INDEXED_KEYS_A_DESIGNED_ROW_READS.includes(key)).forEach(
        (key) => {
          expect(variableInfo).toHaveTextContent(`${key}: value of ${key}`);
        },
      );

      // `unit` is the one the design labels itself, so it appears once, under that label.
      expect(screen.getByTestId('variable-info-unit')).toHaveTextContent('Unit: value of unit');
      expect(occurrences(sectionText('variable-info'), 'value of unit')).toBe(1);
    });

    // Suppression is keyed on the raw key the row read, not on the design's label, so a
    // deployment spelling it `harmonizationLink` gets the same single row.
    it('does not list a designed row a second time under its raw key', async () => {
      const meta = {
        accession: 'MONDO:004979',
        subjectType: 'Human',
        vocabulary: 'Mondo Disease Ontology',
        harmonizationLink: HARMONIZATION_URL,
        comment: 'A curator wrote this by hand',
      };
      await renderResultInfo(makeDetail({ ...DBGAP_VARIABLE, meta, table: null, study: null }));

      const text = sectionText('variable-info');
      ['MONDO:004979', 'Human', 'Mondo Disease Ontology', HARMONIZATION_URL].forEach((value) => {
        expect(occurrences(text, value)).toBe(1);
      });
      ['accession:', 'subjectType:', 'vocabulary:', 'harmonizationLink:'].forEach((rawLabel) => {
        expect(text).not.toContain(rawLabel);
      });
      // The key no designed row reads is still there.
      expect(text).toContain('comment: A curator wrote this by hand');
    });

    it('shows the first 10 rows and toggles the rest with show more', async () => {
      await renderResultInfo(
        makeDetail({
          ...DBGAP_VARIABLE,
          meta: Object.fromEntries(
            Array.from({ length: 8 }, (_, index) => [`meta ${index + 1}`, `value ${index + 1}`]),
          ),
          table: null,
          study: null,
        }),
      );

      // Name, Description, Accession and Type, then six of the eight bag rows.
      const variableInfo = screen.getByTestId('variable-info');
      expect(variableInfo).toHaveTextContent('meta 6: value 6');
      expect(variableInfo).not.toHaveTextContent('meta 7: value 7');

      const showMoreButton = screen.getByTestId('show-more-variable-info');
      expect(showMoreButton).toHaveTextContent('Show More');

      await fireEvent.click(showMoreButton);

      expect(variableInfo).toHaveTextContent('meta 7: value 7');
      expect(variableInfo).toHaveTextContent('meta 8: value 8');
      expect(showMoreButton).toHaveTextContent('Show Less');
    });
  });

  /**
   * Normalising a key to compare it is lossy, so two raw keys can land on one alias.
   * `concept_node_meta` is unique on the raw `(key, concept_node_id)` only, and
   * `ConceptMetaExtractor` title-cases each `_`-delimited word, so a deployment holding both
   * `subject_type` and `subjectType` sends "Subject Type" and "SubjectType" in one bag.
   * Exercising each spelling on its own, as the table above does, cannot see a collision.
   */
  describe('colliding meta keys', () => {
    it.each([
      { case: 'the empty one first', meta: { 'Subject Type': '', SubjectType: 'Human' } },
      { case: 'the populated one first', meta: { SubjectType: 'Human', 'Subject Type': '' } },
    ])('reads the populated spelling with $case', async ({ meta }) => {
      await renderResultInfo(makeDetail({ ...DBGAP_VARIABLE, meta, table: null, study: null }));

      expect(screen.getByTestId('variable-info-subject-type')).toHaveTextContent(
        'Subject Type: Human',
      );
      expect(occurrences(sectionText('variable-info'), 'Human')).toBe(1);
    });

    // Two populated spellings: the first in the bag wins, and the loser is still listed under
    // its own key rather than disappearing.
    it('takes the first populated spelling, and keeps the other in the bag', async () => {
      await renderResultInfo(
        makeDetail({
          ...DBGAP_VARIABLE,
          meta: { 'Subject Type': 'Human', SubjectType: 'Mouse' },
          table: null,
          study: null,
        }),
      );

      expect(screen.getByTestId('variable-info-subject-type')).toHaveTextContent(
        'Subject Type: Human',
      );
      expect(screen.getByTestId('variable-info')).toHaveTextContent('SubjectType: Mouse');
    });

    // Alias order beats bag order: the plural spelling is the design's own label.
    it('prefers the earlier alias over the earlier key in the bag', async () => {
      await renderResultInfo(
        makeDetail({
          ...DBGAP_VARIABLE,
          meta: {
            harmonizationLink: 'https://example.org/link',
            harmonization_methods: 'https://example.org/methods',
          },
          table: null,
          study: null,
        }),
      );

      expect(
        screen.getByTestId('variable-info-harmonization-methods').querySelector('a'),
      ).toHaveAttribute('href', 'https://example.org/methods');
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
