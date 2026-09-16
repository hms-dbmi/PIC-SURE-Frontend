import type { ConsentsMap, User } from '../../src/lib/models/User';
import type { SearchResult } from '../../src/lib/models/Search';
import { PicsurePrivileges, BDCPrivileges } from '../../src/lib/models/Privilege';
import type { DashboardResp } from '$lib/stores/Dashboard';
import type { Indexable } from '$lib/types';

export const HPDS = process.env.VITE_RESOURCE_HPDS;

export const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6OTYwOTU3Mjk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.M1W7a3jQNoHQxAUwfj3sDqyVtNH_DkRdzsIF3prIYQA';
export const mockExpiredToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6MTYxMjE2NDk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.kzaW-ZkhCPlTgdGQQAz_CA1ZB80PpZ5aiRa2lj46hbw';

const conceptDetailPaths = {
  STUDY123: '\\STUDY123\\',
  GENDER: '\\STUDY123\\GENDER\\',
  HEIGHT: '\\STUDY123\\HEIGHT\\',
  WEIGHT: '\\STUDY123\\WEIGHT\\',
  PHS001: '\\phs001\\',
  SEX: '\\phs001\\SEX\\',
  SAMPLE_NAME: '\\phs001\\SAMPLE NAME\\',
  SAMPLE_ID: '\\phs001\\SAMPLE ID\\',
};

const defaultConceptDetail = {
  display: '',
  description: null,
  allowFiltering: true,
  studyAcronym: '',
  children: null,
  meta: {},
  table: null,
  study: {
    fullName: '',
    abbreviation: '',
    description: '',
    meta: {},
  },
};

const conceptDetails: Indexable = {
  [conceptDetailPaths.STUDY123]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.STUDY123,
    name: 'STUDY123',
    dataset: 'STUDY123',
  },
  [conceptDetailPaths.GENDER]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.GENDER,
    name: 'GENDER',
    dataset: 'STUDY123',
    values: ['Male', 'Female', 'Undisclosed'],
    study: {
      ...defaultConceptDetail.study,
      ref: 'STUDY123',
    },
  },
  [conceptDetailPaths.HEIGHT]: {
    ...defaultConceptDetail,
    type: 'Continuous',
    conceptPath: conceptDetailPaths.HEIGHT,
    name: 'HEIGHT',
    dataset: 'STUDY123',
    min: 0,
    max: 300,
    study: {
      ...defaultConceptDetail.study,
      ref: 'STUDY123',
    },
  },
  [conceptDetailPaths.WEIGHT]: {
    ...defaultConceptDetail,
    type: 'Continuous',
    conceptPath: conceptDetailPaths.WEIGHT,
    name: 'HEIGHT',
    dataset: 'STUDY123',
    min: 0,
    max: 1000,
    study: {
      ...defaultConceptDetail.study,
      ref: 'STUDY123',
    },
  },
  [conceptDetailPaths.PHS001]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.PHS001,
    name: 'phs001',
    dataset: 'phs001',
  },
  [conceptDetailPaths.SEX]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.SEX,
    name: 'SEX',
    dataset: 'phs001',
    values: ['MALE', 'FEMALE', 'UNSPECIFIED'],
    study: {
      ...defaultConceptDetail.study,
      ref: 'phs001',
    },
  },
  [conceptDetailPaths.SAMPLE_NAME]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.SAMPLE_NAME,
    name: 'SAMPLE_NAME',
    dataset: 'phs001',
    values: ['BLOOD', 'GOO'],
    study: {
      ...defaultConceptDetail.study,
      ref: 'phs001',
    },
  },
  [conceptDetailPaths.SAMPLE_ID]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.SAMPLE_ID,
    name: 'SAMPLE_ID',
    dataset: 'phs001',
    values: ['34325', '67356245'],
    study: {
      ...defaultConceptDetail.study,
      ref: 'phs001',
    },
  },
};

const conceptTree: Indexable = {
  [conceptDetailPaths.PHS001]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.PHS001,
    name: 'phs001',
    dataset: 'phs001',
    children: [conceptDetails.SEX, conceptDetails.SAMPLE_NAME, conceptDetails.SAMPLE_ID],
  },
  [conceptDetailPaths.STUDY123]: {
    ...defaultConceptDetail,
    type: 'Categorical',
    conceptPath: conceptDetailPaths.STUDY123,
    name: 'STUDY123',
    dataset: 'STUDY123',
    children: [conceptDetails.GENDER, conceptDetails.HEIGHT, conceptDetails.WEIGHT],
  },
};

export const datasetDetails = {
  paths: conceptDetailPaths,
  concepts: conceptDetails,
  tree: conceptTree,
};

export const datasets = [
  {
    // Active
    uuid: '11111111-1111-1111-1111-111111111111',
    query: {
      uuid: '11111111-1111-1111-1111-111111111112',
      startTime: 1769731200000,
      status: 'AVAILABLE',
      resourceResultId: '11111111-1111-1111-1111-111111111113',
      query: JSON.stringify({
        resourceCredentials: { BEARER_TOKEN: null },
        query: {
          select: [conceptDetailPaths.GENDER, conceptDetailPaths.HEIGHT, conceptDetailPaths.WEIGHT],
          authorizationFilters: [],
          phenotypicClause: {
            operator: 'AND',
            phenotypicClauses: [
              {
                phenotypicFilterType: 'FILTER',
                conceptPath: conceptDetailPaths.GENDER,
                not: false,
                values: ['Undisclosed'],
              },
            ],
            not: false,
          },
          genomicFilters: [],
          expectedResultType: 'DATAFRAME',
          picsureId: null,
          id: null,
        },
        resourceUUID: '11111111-1111-1111-1111-111111111114',
      }),
      resource: {
        uuid: '11111111-1111-1111-1111-111111111115',
        name: 'hpds',
      },
    },
    name: 'some-test-I-saved',
    archived: false,
  },
  {
    // Archived
    uuid: '22222222-2222-2222-2222-222222222222',
    query: {
      uuid: '22222222-2222-2222-2222-222222222223',
      startTime: 1770076800000,
      status: 'AVAILABLE',
      resourceResultId: '22222222-2222-2222-2222-222222222224',
      query: JSON.stringify({
        resourceCredentials: { BEARER_TOKEN: null },
        query: {
          select: [
            conceptDetailPaths.SEX,
            conceptDetailPaths.SAMPLE_NAME,
            conceptDetailPaths.SAMPLE_ID,
          ],
          authorizationFilters: [],
          phenotypicClause: {
            operator: 'AND',
            phenotypicClauses: [
              {
                phenotypicFilterType: 'ANY_RECORD_OF',
                conceptPath: '\\\\phs001\\\\',
                not: false,
              },
            ],
            not: false,
          },
          genomicFilters: [],
          expectedResultType: 'DATAFRAME',
          picsureId: null,
          id: null,
        },
        resourceUUID: '22222222-2222-2222-2222-222222222225',
      }),
      resource: {
        uuid: '22222222-2222-2222-2222-222222222226',
        name: 'hpds',
      },
    },
    name: 'some-deleted-test-I-don\t-need',
    archived: true,
  },
];

export const newDatasetResponse = {
  status: 'QUEUED',
  resourceID: HPDS,
  resourceStatus: 'PENDING',
  picsureResultId: '11111111-1111-1111-1111-111111111111',
  resourceResultId: '22222222-2222-2222-2222-222222222222',
  resultMetadata: {
    picsureQueryId: '33333333-3333-3333-3333-333333333333',
  },
  sizeInBytes: 0,
  startTime: 1746109996083,
  duration: 0,
  expiration: 0,
};

export const availableDatasetResponse = {
  status: 'AVAILABLE',
  resourceID: HPDS,
  resourceStatus: 'SUCCESS',
  picsureResultId: '11111111-1111-1111-1111-111111111111',
  resourceResultId: '22222222-2222-2222-2222-222222222222',
  resultMetadata: {
    picsureQueryId: '33333333-3333-3333-3333-333333333333',
  },
  sizeInBytes: 1127,
  startTime: 1746057600000,
  duration: 258,
  expiration: 0,
};

export const mockDashboard: DashboardResp = {
  columns: [
    { label: 'Name', dataElement: 'name' },
    { label: 'Link', dataElement: 'additional_info_link' },
  ],
  rows: [
    {
      name: 'A',
      description: 'This is a description 1',
      additional_info_link: 'foo.invalid',
      dataset_id: '1',
    },
    {
      name: 'B',
      description: 'This is a description 2',
      additional_info_link: 'bar.invalid',
      dataset_id: '2',
    },
    {
      name: 'C',
      description: 'This is a description 3',
      additional_info_link: null,
      dataset_id: '3',
    },
  ],
};

export const mockConsents: ConsentsMap = {
  '\\_consents\\': ['test_data_set', 'STUDY123', 'phs001', 'phs123'],
  '\\_harmonized_consent\\': ['test_data_set', 'STUDY123', 'phs001', 'phs123'],
  '\\_topmed_consents\\': ['test_data_set', 'STUDY123', 'phs001', 'phs123'],
};

export const picsureUser: User = {
  uuid: '1234',
  email: 'test@pic-sure.org',
  privileges: [
    PicsurePrivileges.QUERY,
    BDCPrivileges.DICTIONARY,
    BDCPrivileges.AUTHORIZED_ACCESS,
    BDCPrivileges.OPEN,
    BDCPrivileges.NAMED_DATASET,
    PicsurePrivileges.API_ACCESS,
  ],
  queryScopes: ['Gene_with_variant', 'test_data_set', 'STUDY123', 'phs001', 'phs123'],
  // expired token
  token: mockToken,
  acceptedTOS: true,
  consents: mockConsents,
};

export const userTypes = {
  generalUser: {
    privileges: [
      PicsurePrivileges.QUERY,
      PicsurePrivileges.NAMED_DATASET,
      PicsurePrivileges.API_ACCESS,
    ],
  },
  noScopeUser: {
    privileges: [
      PicsurePrivileges.QUERY,
      PicsurePrivileges.NAMED_DATASET,
      PicsurePrivileges.API_ACCESS,
    ],
    queryScopes: undefined,
  },
  adminUser: {
    privileges: [
      PicsurePrivileges.QUERY,
      PicsurePrivileges.ADMIN,
      PicsurePrivileges.NAMED_DATASET,
      PicsurePrivileges.API_ACCESS,
    ],
  },
  superUser: {
    privileges: [
      PicsurePrivileges.QUERY,
      PicsurePrivileges.SUPER,
      PicsurePrivileges.NAMED_DATASET,
      PicsurePrivileges.API_ACCESS,
    ],
  },
  noTOS: { acceptedTOS: false },
};

export const crossCountSyncResponseInital = {
  results: {
    phenotypes: {
      '\\_studies_consents\\': '458917 ±3',
      '\\_studies_consents\\open_access-1000Genomes\\': '6267',
      '\\_studies_consents\\other_data\\code\\': '4000',
      '\\_studies_consents\\tutorial-biolincc_camp\\': '2000',
      '\\_studies_consents\\tutorial-biolincc_digitalis\\': '3000',
      '\\_studies_consents\\tutorial-biolincc_framingham\\': '4000',
      '\\_studies_consents\\phs001\\': '12 ±3',
    },
  },
};

export const crossCountSyncResponsePlus3 = {
  '\\_studies_consents\\': '458917 ±3',
  '\\_studies_consents\\open_access-1000Genomes\\': '6267',
  '\\_studies_consents\\other_data\\code\\': '< 10',
  '\\_studies_consents\\tutorial-biolincc_camp\\': '2000',
  '\\_studies_consents\\tutorial-biolincc_digitalis\\': '3000',
  '\\_studies_consents\\tutorial-biolincc_framingham\\': '12',
  '\\_studies_consents\\phs001\\': '2305 ±3',
};

export const crossCountSyncResponseLessThan10 = {
  '\\_studies_consents\\': '< 10',
  '\\_studies_consents\\open_access-1000Genomes\\': '< 10',
  '\\_studies_consents\\other_data\\code\\': '< 10',
  '\\_studies_consents\\tutorial-biolincc_camp\\': '< 10',
  '\\_studies_consents\\tutorial-biolincc_digitalis\\': '< 10',
  '\\_studies_consents\\tutorial-biolincc_framingham\\': '< 10',
};

export const searchResultPath = '*/**/picsure/dictionary/concepts?page_number=0&page_size=10';
export const searchResultPathForSampleIds =
  '*/**/picsure/dictionary/concepts?page_number=0&page_size=10000';
export const facetResultPath = '*/**/picsure/dictionary/facets';
export const conceptsDetailPath = '*/**/picsure/dictionary/concepts/detail'; // + name
export const conceptTreePath = '*/**/picsure/dictionary/concepts/tree'; // + name
export const configurationPath = '*/**/picsure/operations/configuration';

export const searchRequest = { facets: [], search: 'age' };

/**
 * A gene-with-variant filter in the shape `createGenomicFilter` produces, for seeding
 * `sessionStorage.genomicFilters` before a page load. `restoreGenomicFilters` recomputes the
 * uuid from the contents, so the one here is only a placeholder.
 */
export const genomicFilter = {
  uuid: '',
  id: 'genomic',
  filterType: 'genomic',
  displayType: 'any',
  variableName: 'Genomic Filter',
  description: 'Gene with variant: CHD8',
  Gene_with_variant: ['CHD8'],
  allowFiltering: true,
  dataset: '',
};

export const searchResults = {
  totalPages: 1,
  totalElements: 7,
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: {
      unsorted: true,
      sorted: false,
      empty: true,
    },
    offset: 0,
    unpaged: false,
    paged: true,
  },
  numberOfElements: 4,
  first: true,
  last: true,
  size: 10,
  content: [
    {
      conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Any family with heart attack?\\',
      name: 'heart_test',
      display: 'Any family with heart attack?',
      dataset: 'test_data_set',
      allowFiltering: true,
      studyAcronym: 'TDS',
      description: 'Do you have a history of heart attack? Including extended family?',
      values: ['Yes', 'No', "Don't know"],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Did you die from a heart attack?\\',
      name: 'heart_died',
      display: 'Are you dead from a heart attack?',
      dataset: 'test_data_set',
      allowFiltering: true,
      studyAcronym: 'TDS',
      description: 'Did you die that one time. Are you a ghost?',
      values: ['Yes', 'No'],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\TEST\\questionnaire\\disease\\Any tests today?\\',
      name: 'MCQ300a',
      display: 'Any tests today?',
      dataset: 'test_data_set',
      allowFiltering: true,
      studyAcronym: 'TDS',
      description: 'This is a test description?',
      values: [
        'Yes',
        'No',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
      ],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\this\\is\\a\\age\\',
      name: 'age1',
      display: 'age',
      dataset: 'test_data_set',
      allowFiltering: true,
      studyAcronym: 'TDS',
      description: 'Age',
      min: 0,
      max: 99,
      meta: null,
      type: 'Continuous',
    },
    {
      conceptPath: '\\Study123\\AGE\\',
      name: 'AGE',
      display: 'AGE',
      dataset: 'STUDY123',
      allowFiltering: true,
      studyAcronym: 'S1',
      description: 'This is a test description for Study123?',
      min: 0,
      max: 25,
      meta: null,
      type: 'Continuous',
    },
    {
      conceptPath: '\\phs123\\age\\',
      name: 'AGE_CATEGORY',
      display: 'age',
      dataset: 'phs123',
      allowFiltering: true,
      studyAcronym: 'Test PSH',
      description: "Participant's age (category)",
      values: ['21', '22', '23', '24', '25'],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\phs123\\age1\\',
      name: 'AGE_CATEGORY',
      display: 'age',
      dataset: 'phs123',
      studyAcronym: 'Test PSH',
      allowFiltering: false,
      description: "Participant's age (category)",
      values: ['21', '22', '23', '24', '25', '26'],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\phs009\\west\\',
      name: 'WESTERN',
      display: 'West',
      dataset: 'phs009',
      studyAcronym: 'Test direction',
      allowFiltering: true,
      description: 'A specific direction',
      children: null,
      min: 0,
      max: 25,
      meta: null,
      type: 'Continuous',
    },
  ],
  number: 0,
  sort: {
    unsorted: true,
    sorted: false,
    empty: true,
  },
  empty: false,
};

export const mockDataWithChildren = {
  conceptPath: '\\SOMEDATA\\questionnaire\\disease\\',
  name: 'disease',
  display: 'Disease',
  dataset: 'test_data_set',
  allowFiltering: true,
  studyAcronym: 'TDS',
  description: 'Disease',
  values: ['Yes', 'No', "Don't know"],
  children: [
    {
      conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Any family with heart attack?\\',
      name: 'heart_test',
      display: 'Any family with heart attack?',
      dataset: 'test_data_set',
      allowFiltering: true,
      description: 'Do you have a history of heart attack? Including extended family?',
      values: ['Yes', 'No', "Don't know"],
      children: [],
      meta: null,
      type: 'Categorical',
    },
  ],
  meta: null,
  type: 'Categorical',
};

export const tourSearchResults = {
  totalPages: 1,
  totalElements: 3,
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: {
      unsorted: true,
      sorted: false,
      empty: true,
    },
    offset: 0,
    unpaged: false,
    paged: true,
  },
  numberOfElements: 3,
  first: true,
  last: true,
  size: 3,
  content: [
    {
      conceptPath: '\\this\\is\\a\\age\\',
      name: 'age1',
      display: 'age',
      dataset: 'test_data_set',
      allowFiltering: true,
      description: 'Age',
      min: 0,
      max: 99,
      meta: null,
      type: 'Continuous',
    },
    {
      conceptPath: '\\phs123\\age\\',
      name: 'AGE_CATEGORY',
      display: 'age',
      dataset: 'phs123',
      allowFiltering: true,
      description: "Participant's age (category)",
      values: ['21', '22', '23', '24', '25'],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\phs123\\age1\\',
      name: 'AGE_CATEGORY',
      display: 'age',
      dataset: 'phs123',
      allowFiltering: true,
      description: "Participant's age (category)",
      values: ['21', '22', '23', '24', '25', '26'],
      children: null,
      meta: null,
      type: 'Categorical',
    },
  ],
  number: 0,
  sort: {
    unsorted: true,
    sorted: false,
    empty: true,
  },
  empty: false,
};

export const detailResponseCat = {
  type: 'Categorical',
  conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Any family with heart attack?\\',
  name: 'heart_test',
  display: 'Any family with heart attack?',
  studyAcronym: 'TDS',
  dataset: 'test_data_set',
  allowFiltering: true,
  description: 'Do you have a history of heart attack? Including extended family?',
  values: ['Yes', 'No', "Don't know"],
  children: null,
  meta: {
    values: ['Yes', 'No', "Don't know"],
    description: 'Do you have a history of heart attack? Including extended family?',
  },
  table: {
    type: 'Categorical',
    conceptPath: '\\SOMEDATA\\questionnaire\\',
    name: 'some_name_for_the_table',
    display: 'some_name_for_the_table',
    dataset: 'test_data_set',
    description: 'Some table description',
    values: [],
    allowFiltering: true,
    studyAcronym: 'TDS',
    children: null,
    meta: {
      description: 'Some table description',
      stigmatized: false,
    },
    table: null,
    study: null,
  },
  study: {
    ref: 'test_data_set',
    fullName: 'Dataset Full Name',
    abbreviation: 'TDS',
    meta: {
      study_link: 'http://www.picsure.org/',
      phase: 'p1',
      study_accession: 'test_data_set.v1.p1',
      study_design: 'Study Testing',
      data_type: 'P',
      study_focus: 'Study Focus',
      version: 'v1',
    },
  },
};

/**
 * The related variable the filter panel stacks under search row 4's main interface.
 *
 * `relatedVariablesOf` admits a `Categorical` child that carries values and a non-blank
 * dataset, so those three fields are load-bearing. So is one that is **absent**: there is no
 * `table` here. A child arrives inside its parent's `children` without one, and
 * `enrichFilterDetails` returns early on a `searchResult` that already has a `table` - so a
 * child carrying one would make the enrichment a no-op.
 *
 * `STUDY123`, because it is one of the datasets `mockConsents` grants. A filter on an
 * unconsented dataset sets `hasInvalidFilter`, and the navigation guard then answers any
 * attempt to leave Explore with the "not authorized ... remove the invalid filters" dialog
 * instead of navigating - which a spec that leaves and comes back cannot get past.
 */
const relatedVariableChild: SearchResult = {
  type: 'Categorical',
  conceptPath: '\\Study123\\AGE\\category\\',
  name: 'AGE_BRACKET',
  display: 'Age bracket',
  dataset: 'STUDY123',
  studyAcronym: 'S1',
  allowFiltering: true,
  description: 'Which bracket the recorded age falls in',
  values: ['Under 18', '18 to 64', '65 and over'],
  children: null,
  meta: null,
};

/**
 * A `concepts/detail` response for search row 4, `\Study123\AGE\`, with a related variable
 * under it.
 *
 * Row 4 is `Continuous`, so the panel's main interface is a min/max pair rather than a value
 * list. Left blank with a related variable present, `mainEngaged` is false and the main
 * variable writes no filter at all - so a spec can put exactly one filter in the cohort, know
 * it is the child's, and have the only value list on screen be the one it came from.
 *
 * Spread from the row so the detail page and the results list cannot drift: the row is what
 * the card was rendered from, and `children` is the one field a detail response adds.
 */
export const detailResponseRelatedParent = {
  ...(searchResults.content[4] as SearchResult),
  children: [relatedVariableChild],
};

/**
 * What the related variable's **own** `concepts/detail` call answers - the other half of the
 * pair above, and the reason `enrichFilterDetails` has anything to write.
 *
 * `table` and `study` are the two fields the enrichment copies onto a filter that is already
 * in the tree, in place, with no write to `filterTree`. If this response lacked them the
 * enrichment would fetch, find nothing to copy, and leave the filter exactly as it was -
 * which a spec asserting that the panel did not move would pass for the wrong reason.
 * `table.display` is deliberately a string no other fixture uses, so a spec can assert that
 * *this* table landed on *that* filter rather than merely that some table did.
 *
 * Note that the two halves share a dataset, as a parent and its child do. Concept detail is
 * fetched as `POST concepts/detail/{dataset}` with the concept path in the body, so a route
 * keyed on the URL would answer both requests with whichever of these was registered. Serve
 * them with `mockConceptDetailByPath`.
 *
 * No main variable can exercise this path. `VariableDetail` hands the panel the object
 * `getConceptDetails` returned; the filter constructors store that same object as the
 * filter's `searchResult`; and the enrichment re-requests the same concept path and dataset,
 * which `getConceptDetails` answers out of its own cache with the identical object - so the
 * patch assigns each field to itself. A related variable is read off `children` and has a
 * cache key of its own, which is what makes its fetch real.
 */
export const detailResponseRelatedChild = {
  ...relatedVariableChild,
  table: {
    type: 'Categorical',
    conceptPath: '\\Study123\\AGE\\',
    name: 'study123_age_table',
    display: 'Study123 age measurements table',
    dataset: 'STUDY123',
    description: 'The table the Study123 age variables sit in',
    values: [],
    allowFiltering: true,
    studyAcronym: 'S1',
    children: null,
    table: null,
    study: null,
    meta: null,
  },
  study: {
    ref: 'STUDY123',
    fullName: 'Study 123 Full Name',
    abbreviation: 'S1',
    meta: {
      study_accession: 'STUDY123.v1.p1',
    },
  },
};

export const hierarchyResponse = [
  {
    conceptPath: '\\SOMEDATA\\questionnaire\\disease\\',
    name: 'disease',
    display: 'Disease',
    dataset: 'test_data_set',
    allowFiltering: true,
    studyAcronym: 'TDS',
    description: 'Disease',
    type: 'Categorical',
  },
  {
    conceptPath: '\\SOMEDATA\\questionnaire\\',
    name: 'heart_test',
    display: 'Questionnaire',
    dataset: 'test_data_set',
    allowFiltering: true,
    studyAcronym: 'TDS',
    description: 'Do you have a history of heart attack? Including extended family?',
    type: 'Categorical',
  },
  {
    conceptPath: '\\SOMEDATA\\',
    name: 'heart_died',
    display: 'SOMEDATA',
    dataset: 'test_data_set',
    allowFiltering: true,
    studyAcronym: 'TDS',
    description: 'Test description and this is a long description to test the UI?',
    type: 'Categorical',
  },
];

export const detailResponseCatSameDataset = {
  type: 'Categorical',
  conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Did you die from a heart attack?\\',
  name: 'heart_died',
  display: 'Are you dead from a heart attack?',
  dataset: 'test_data_set',
  allowFiltering: true,
  description: 'Did you die that one time. Are you a ghost?',
  values: ['Yes', 'No'],
  children: null,
  meta: {
    values: ['Yes', 'No'],
    description: 'Did you die that one time. Are you a ghost?',
  },
};

export const detailResponseCat2 = {
  type: 'Categorical',
  conceptPath: '\\TEST\\questionnaire\\disease\\Any tests today?\\',
  name: 'MCQ300a',
  display: 'Any tests today?',
  dataset: 'test_data_set',
  allowFiltering: true,
  description: 'This is a test description?',
  values: [
    'Yes',
    'No',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
  ],
  children: null,
  meta: {
    values: [
      'Yes',
      'No',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
    ],
    description: 'This is a test description?',
  },
};

export const detailResForAge = {
  conceptPath: '\\phs123\\age\\',
  name: 'AGE_CATEGORY',
  display: 'age',
  dataset: 'phs123',
  description: "Participant's age (category)",
  values: ['21', '22', '23', '24', '25'],
  children: null,
  meta: {
    values: ['21', '22', '23', '24', '25'],
  },
  type: 'Categorical',
};

export const detailResForAge2 = {
  conceptPath: '\\phs123\\age1\\',
  name: 'AGE_CATEGORY',
  display: 'age',
  dataset: 'phs123',
  description: "Participant's age2 (category)",
  values: ['21', '22', '23', '24', '25', '26'],
  children: null,
  meta: {
    values: ['21', '22', '23', '24', '25', '26'],
  },
  type: 'Categorical',
};

export const detailResponseNum = {
  type: 'Continuous',
  conceptPath: '\\this\\is\\a\\age\\',
  name: 'age1',
  display: 'age',
  dataset: 'test_data_set',
  description: 'Age',
  children: null,
  min: 0,
  max: 99,
  meta: {
    description: 'Age',
  },
};

export const facetResponseWithZeroCount = [
  {
    name: 'things_that_use_consents',
    display: 'Consented Things',
    description: 'This is a description',
    facets: [
      {
        name: 'thing1',
        display: 'Thing 1',
        description: 'Thing 1',
        count: 0,
      },
      {
        name: 'thing2',
        display: 'Thing 2',
        description: 'Thing 2',
        count: 1,
      },
    ],
  },
  {
    name: 'another_category_name',
    display: 'Another Category Name',
    description: 'Hello World',
    facets: [
      {
        name: 'facet1',
        display: 'Facet 1',
        description: 'facet1 full name',
        count: 0,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet2',
        display: 'Facet 2',
        description: 'facet2 full name',
        count: 0,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet3',
        display: 'This is a really long facet name for testing',
        description: 'facet3 full name',
        count: 0,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
    ],
  },
];

export const facetsResponse = [
  {
    name: 'study_ids_dataset_ids',
    display: 'Study IDs',
    description: '',
    facets: [
      {
        name: 'study2',
        display: 'National Health and Nutrition Examination Survey',
        description: 'study2 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs002715',
        display: 'NSRR CFS',
        description: 'NSRR CFS full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs000284',
        display: 'CFS',
        description: 'CFS full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs002385',
        display: 'HCT_for_SCD',
        description: 'HCT_for_SCD full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study1',
        display: 'Study Display 1',
        description: 'study1 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study3',
        display: 'Study Display 3',
        description: 'study3 full name',
        count: 5,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study4',
        display: 'Study Display 4',
        description: 'study4 full name',
        count: 2,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study5',
        display: 'Study Display 5',
        description: 'study5 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study6',
        display: 'Study Display 6',
        description: 'study6 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study7',
        display: 'Study Display 7',
        description: 'study7 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study8',
        display: 'Study Display 8',
        description: 'study8 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study9',
        display: 'Study Display 9',
        description: 'study9 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'Empty',
        display: 'Empty',
        description: 'Empty',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
    ],
  },
  {
    name: 'dataset_id',
    display: 'Dataset IDs',
    description: '',
    facets: [
      {
        name: 'Test For Landing',
        display: 'Test',
        description: 'dataset_id study',
        count: 1,
        children: null,
        category: 'dataset_id',
        meta: null,
      },
      {
        name: 'Test For Landing 2',
        display: 'Test 2',
        description: 'dataset_id study',
        count: 1,
        children: null,
        category: 'dataset_id',
        meta: null,
      },
    ],
  },
  {
    name: 'another_category_name',
    display: 'Another Category Name',
    description: 'Hello World',
    facets: [
      {
        name: 'facet1',
        display: 'Facet 1',
        description: 'facet1 full name',
        count: 1,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet2',
        display: 'Facet 2',
        description: 'facet2 full name',
        count: 4,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet3',
        display: 'This is a really long facet name for testing',
        description: 'facet3 full name',
        count: 1,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
    ],
  },
  {
    name: 'another_category_name_empty',
    display: 'Empty Category',
    description: 'Hello World',
    facets: [
      {
        name: 'facet1',
        display: 'Facet 1',
        description: 'facet1 full name',
        count: 0,
        children: null,
        category: 'another_category_name_empty',
        meta: null,
      },
      {
        name: 'facet2',
        display: 'Facet 2',
        description: 'facet2 full name',
        count: 0,
        children: null,
        category: 'another_category_name_empty',
        meta: null,
      },
      {
        name: 'facet3',
        display: 'This is a really long facet name for testing',
        description: 'facet3 full name',
        count: 0,
        children: null,
        category: 'another_category_name_empty',
        meta: null,
      },
    ],
  },
];

export const facetsResponseToTestZeroCount = [
  {
    name: 'study_ids_dataset_ids',
    display: 'Study IDs/Dataset IDs',
    description: '',
    facets: [
      {
        name: 'study2',
        display: 'National Health and Nutrition Examination Survey',
        description: 'study2 full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs002715',
        display: 'NSRR CFS',
        description: 'NSRR CFS full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs000284',
        display: 'CFS',
        description: 'CFS full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs002385',
        display: 'HCT_for_SCD',
        description: 'HCT_for_SCD full name',
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study1',
        display: 'Study Display 1',
        description: 'study1 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study3',
        display: 'Study Display 3',
        description: 'study3 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study4',
        display: 'Study Display 4',
        description: 'study4 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study5',
        display: 'Study Display 5',
        description: 'study5 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study6',
        display: 'Study Display 6',
        description: 'study6 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study7',
        display: 'Study Display 7',
        description: 'study7 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study8',
        display: 'Study Display 8',
        description: 'study8 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study9',
        display: 'Study Display 9',
        description: 'study9 full name',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'Empty',
        display: 'Empty',
        description: 'Empty',
        count: 0,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
    ],
  },
  {
    name: 'dataset_id',
    display: 'Study IDs/Dataset IDs',
    description: '',
    facets: [
      {
        name: 'Test For Landing',
        display: 'Test',
        description: 'dataset_id study',
        count: 1,
        children: null,
        category: 'dataset_id',
        meta: null,
      },
      {
        name: 'Test For Landing 2',
        display: 'Test 2',
        description: 'dataset_id study',
        count: 1,
        children: null,
        category: 'dataset_id',
        meta: null,
      },
    ],
  },
  {
    name: 'another_category_name',
    display: 'Another Category Name',
    description: 'Hello World',
    facets: [
      {
        name: 'facet1',
        display: 'Facet 1',
        description: 'facet1 full name',
        count: 1,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet2',
        display: 'Facet 2',
        description: 'facet2 full name',
        count: 4,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet3',
        display: 'This is a really long facet name for testing',
        description: 'facet3 full name',
        count: 1,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
    ],
  },
  {
    name: 'another_category_name_empty',
    display: 'Empty Category',
    description: 'Hello World',
    facets: [
      {
        name: 'facet1',
        display: 'Facet 1',
        description: 'facet1 full name',
        count: 0,
        children: null,
        category: 'another_category_name_empty',
        meta: null,
      },
      {
        name: 'facet2',
        display: 'Facet 2',
        description: 'facet2 full name',
        count: 0,
        children: null,
        category: 'another_category_name_empty',
        meta: null,
      },
      {
        name: 'facet3',
        display: 'This is a really long facet name for testing',
        description: 'facet3 full name',
        count: 0,
        children: null,
        category: 'another_category_name_empty',
        meta: null,
      },
    ],
  },
];

export const nestedFacetsResponse = [
  ...facetsResponse,
  {
    name: 'nested_category',
    display: 'Nested Category',
    description: 'Nested Category Description',
    facets: [
      {
        name: 'nested_facet',
        display: 'Nested Facet',
        description: 'Nested Facet Description',
        count: 8,
        category: 'nested_category',
        children: [
          {
            name: 'nested_facet_child',
            display: 'Nested Facet Child',
            description: 'Nested Facet Child Description',
            count: 2,
            category: 'nested_category',
            children: null,
          },
          {
            name: 'nested_facet_child_2',
            display: 'Nested Facet Child 2',
            description: 'Nested Facet Child 2 Description',
            count: 5,
            category: 'nested_category',
            children: null,
          },
          {
            name: 'nested_facet_child_3',
            display: 'Nested Facet Child 3',
            description: 'Nested Facet Child 3 Description',
            count: 1,
            category: 'nested_category',
            children: null,
          },
        ],
      },
      {
        name: 'nested_facet_2',
        display: 'Nested Facet 2',
        description: 'Nested Facet 2 Description',
        count: 1,
        category: 'nested_category',
        children: null,
      },
      {
        name: 'nested_facet_3',
        display: 'Nested Facet 3',
        description: 'Nested Facet 3 Description',
        count: 10,
        category: 'nested_category',
        children: [
          {
            name: 'nested_facet_child_4',
            display: 'Nested Facet Child 4',
            description: 'Nested Facet Child 4 Description',
            count: 1,
            category: 'nested_category',
            children: null,
          },
          {
            name: 'nested_facet_child_5',
            display: 'Nested Facet Child 5',
            description: 'Nested Facet Child 5 Description',
            count: 1,
            category: 'nested_category',
            children: null,
          },
          {
            name: 'nested_facet_child_6',
            display: 'Nested Facet Child 6',
            description: 'Nested Facet Child 6 Description',
            count: 5,
            category: 'nested_category',
            children: null,
          },
          {
            name: 'nested_facet_child_7',
            display: 'Nested Facet Child 7',
            description: 'Nested Facet Child 7 Description',
            count: 3,
            category: 'nested_category',
            children: null,
          },
        ],
      },
      {
        name: 'nested_facet_4',
        display: 'Nested Facet 4',
        description: 'Nested Facet 4 Description',
        count: 300,
        category: 'nested_category',
        children: null,
      },
    ],
  },
];

const _application = {
  app1: {
    uuid: 'a1234',
    name: 'APP One',
    description: 'App one desc',
    token: 'app1-token',
    url: '/app1',
    enable: true,
  },
  app2: {
    uuid: 'a2345',
    name: 'APP Two',
    description: 'App two desc',
    token: 'app2-token',
    url: '/app2',
    enable: true,
  },
};

const _privileges = {
  pr1: {
    uuid: 'p1234',
    name: 'super_admin',
    description: 'super admins',
    queryScope: '[]',
    application: undefined,
  },
  pr2: {
    uuid: 'p2345',
    name: 'admin',
    description: 'admins',
    queryScope: '[]',
    application: undefined,
  },
  pr3: {
    uuid: 'p3456',
    name: 'any',
    description: 'any priv',
    queryScope: '[]',
    application: _application.app1,
  },
  pr4: {
    uuid: 'p4567',
    name: 'user',
    description: 'a user priv',
    queryScope: '[]',
    application: _application.app2,
  },
};

export const privileges = Object.values(_privileges);

export const applications = [
  { ..._application.app1, privileges: [_privileges.pr3] },
  { ..._application.app2, privileges: [_privileges.pr4] },
];

const _roles = {
  r1: {
    uuid: 'r1234',
    name: 'Top Admin',
    description: 'top admin role',
    privileges: [_privileges.pr1, _privileges.pr2],
  },
  r2: {
    uuid: 'r2345',
    name: 'User',
    description: 'Normal user',
    privileges: [_privileges.pr3],
  },
  r3: {
    uuid: 'r3456',
    name: 'Random role',
    description: 'Some random role',
    privileges: [_privileges.pr4],
  },
  r4: {
    uuid: 'r4567',
    name: 'Admin',
    description: 'Admin role',
    privileges: [_privileges.pr2],
  },
};
export const roles = Object.values(_roles);

const _connections = {
  c1234: {
    uuid: 'c1234',
    label: 'Some IDP',
    id: 'some-idp',
    subPrefix: 'some-idp|',
    requiredFields: '[{"label":"Email", "id":"email"}]',
  },
  c2345: {
    uuid: 'c2345',
    label: 'Another IDP',
    id: 'another-idp',
    subPrefix: 'another-idp|',
    requiredFields: '[{"label":"Email", "id":"email"}]',
  },
};
export const connections = Object.values(_connections);

export const users = [
  {
    uuid: 'abcd',
    subject: _connections.c1234.subPrefix + 'abcd',
    roles: [_roles.r1, _roles.r2, _roles.r4],
    email: 'abcd@test.com',
    connection: _connections.c1234,
    active: true,
  },
  {
    uuid: 'bcde',
    subject: _connections.c1234.subPrefix + 'bcde',
    roles: [_roles.r1, _roles.r2, _roles.r4],
    email: 'bcde@test.com',
    connection: _connections.c1234,
    active: true,
  },
  {
    uuid: 'cdef',
    roles: [_roles.r2, _roles.r4],
    email: 'cdef@test.com',
    connection: _connections.c1234,
    generalMetadata: '{"email":"cdef@test.com"}',
    active: false,
  },
  {
    uuid: 'defg',
    roles: [_roles.r2],
    email: 'defg@test.com',
    connection: _connections.c2345,
    generalMetadata: '{"email":"defg@test.com"}',
    active: true,
  },
  {
    uuid: 'efgh',
    roles: [_roles.r2],
    email: 'efgh@test.com',
    connection: _connections.c1234,
    generalMetadata: '{"email":"efgh@test.com"}',
    active: false,
  },
  {
    uuid: 'fghi',
    subject: 'google-oauth2|fghi',
    roles: [_roles.r2],
    email: 'fghi@test.com',
    connection: _connections.c1234,
    active: true,
  },
];

export const geneValues = {
  results: [
    '5_8S_rRNA',
    '5S_rRNA',
    '7SK',
    'A1BG',
    'A1CF',
    'A2M',
    'A2ML1',
    'A2ML1-AS1',
    'A2MP1',
    'A3GALT2',
    'A4GALT',
    'A4GNT',
    'A549',
    'A630',
    'A631',
    'A632',
    'A633',
    'A634',
    'A635',
    'A636',
  ],
  page: 1,
  total: 60,
};

export const geneValuesPage2 = {
  results: [
    'A637',
    'A638',
    'A639',
    'A640',
    'A641',
    'A642',
    'CHD2',
    'CHD7',
    'CHD8',
    'CHD9',
    'CHD10',
    'CHD11',
    'CHD12',
    'CHD13',
    'BRCA1',
    'BRCA2',
    'BRCA3',
    'BRCA4',
    'BRCA5',
    'BRCA6',
    'BRCA7',
    'BRCA8',
    'BRCA9',
    'BRCA10',
    'BRCA11',
    'BRCA12',
    'BRCA13',
    'BRCA14',
    'BRCA15',
    'BRCA16',
    'BRCA17',
  ],
  page: 2,
  total: 60,
};

export const geneValuesPage3 = {
  results: [
    'CHD18',
    'CHD19',
    'CHD20',
    'CHD21',
    'CHD22',
    'CHD23',
    'CHD24',
    'CHD25',
    'CHD26',
    'CHD27',
    'CHD28',
    'CHD29',
    'CHD30',
    'CHD31',
    'CHD32',
    'CHD33',
    'CHD34',
    'CHD35',
    'D10S1248',
    'D10S1249',
    'D10S1250',
    'D10S1251',
    'D10S1252',
    'D10S1253',
    'D10S1254',
    'D10S1255',
    'D10S1256',
  ],
  page: 3,
  total: 60,
};

const tsvHeader =
  'CHROM	POSITION	REF	ALT	Variant_consequence_calculated	Variant_class	AC	Gene_with_variant	Variant_severity	Variant_frequency_in_gnomAD	Variant_frequency_as_text	AN	Patients with this variant in subset	Patients with this variant NOT in subset';

export const variantDataAggregate =
  tsvHeader +
  '\n' +
  'somechrom	52478	Z	N	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/8192\n' +
  'somechrom	52485	C	R	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Rare	2	1/1261	0/1024\n' +
  'somechrom	52531	Z	X	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/1024\n' +
  'somechrom	52565	N	K	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/512\n' +
  'somechrom	52691	V	T	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/512\n' +
  'somechrom	52693	V	T	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Common	2	1/1261	0/512\n\n';

export const variantDataFull =
  tsvHeader +
  '  1 2 3 4 5\n' +
  'somechrom	52478	Z	N	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/8192  0/0 0/0 0/0 0/0 0/0\n' +
  'somechrom	52485	C	R	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Rare	2	1/1261	0/1024  0/0 1/1 0/0 0/0 0/0\n' +
  'somechrom	52531	Z	X	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/1024  0/0 0/0 0/0 0/0 0/0\n' +
  'somechrom	52565	N	K	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/512  0/0 0/0 0/0 0/0 1/0\n' +
  'somechrom	52691	V	T	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Novel	2	1/1261	0/512  0/0 0/0 0/0 0/1 0/0\n' +
  'somechrom	52693	V	T	upstream_gene_variant	SNV	2	5_8S_rRNA	null	-10	Common	2	1/1261	0/512  0/1 0/0 0/0 0/0 0/0\n\n';
