import type { User } from '../../src/lib/models/User';
import { PicsurePrivileges, BDCPrivileges } from '../../src/lib/models/Privilege';
import type { QueryInterfaceV2 } from '$lib/models/query/Query';
import type { DashboardResp } from '$lib/stores/Dashboard';

export const HPDS = process.env.VITE_RESOURCE_HPDS;

export const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6OTYwOTU3Mjk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.M1W7a3jQNoHQxAUwfj3sDqyVtNH_DkRdzsIF3prIYQA';
export const mockExpiredToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6MTYxMjE2NDk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.kzaW-ZkhCPlTgdGQQAz_CA1ZB80PpZ5aiRa2lj46hbw';

export const datasets = [
  {
    // Active
    uuid: '3fc5301a-aa58-4abf-bcec-369d4ed9fdd2',
    user: 'test@user',
    name: 'active demo',
    archived: false,
    query: {
      uuid: '6104ee94-1b0c-44cb-bed2-08c95d1d63ee',
    },
    metadata: {},
  },
  {
    // Archived
    uuid: '73952c80-641c-4f35-a527-ebfb3c55e02b',
    user: 'test@user',
    name: 'inactive demo',
    archived: true,
    query: {
      uuid: '853c2c35-f665-462e-8775-aa07121ae3dc',
    },
    metadata: {},
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

const mockQueryTemplate: QueryInterfaceV2 = {
  categoryFilters: {
    '\\_consents\\': ['test_data_set', 'STUDY123', 'phs001', 'phs123'],
    '\\_harmonized_consent\\': ['test_data_set', 'STUDY123', 'phs001', 'phs123'],
    '\\_topmed_consents\\': ['test_data_set', 'STUDY123', 'phs001', 'phs123'],
  },
  numericFilters: {},
  requiredFields: [],
  anyRecordOf: [],
  variantInfoFilters: [
    {
      categoryVariantInfoFilters: {},
      numericVariantInfoFilters: {},
    },
  ],
  expectedResultType: 'COUNT',
  fields: [],
  anyRecordOfMulti: [],
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
  ],
  queryScopes: ['Gene_with_variant', 'test_data_set', 'STUDY123', 'phs001', 'phs123'],
  // expired token
  token: mockToken,
  acceptedTOS: true,
  queryTemplate: mockQueryTemplate,
};

export const userTypes = {
  generalUser: { privileges: [PicsurePrivileges.QUERY] },
  noScopeUser: { privileges: [PicsurePrivileges.QUERY], queryScopes: undefined },
  adminUser: { privileges: [PicsurePrivileges.QUERY, PicsurePrivileges.ADMIN] },
  superUser: { privileges: [PicsurePrivileges.QUERY, PicsurePrivileges.SUPER] },
  dataUser: { privileges: [PicsurePrivileges.QUERY, PicsurePrivileges.DATA_ADMIN] },
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

export const searchResultPath =
  '*/**/picsure/proxy/dictionary-api/concepts?page_number=0&page_size=10';
export const searchResultPathForSampleIds =
  '*/**/picsure/proxy/dictionary-api/concepts?page_number=0&page_size=10000';
export const facetResultPath = '*/**/picsure/proxy/dictionary-api/facets';
export const conceptsDetailPath = '*/**/picsure/proxy/dictionary-api/concepts/detail'; // + name
export const conceptTreePath = '*/**/picsure/proxy/dictionary-api/concepts/tree'; // + name

export const searchRequest = { facets: [], search: 'age' };

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
        children: [
          {
            name: 'nested_facet_child',
            display: 'Nested Facet Child',
            description: 'Nested Facet Child Description',
            count: 2,
            children: null,
          },
          {
            name: 'nested_facet_child_2',
            display: 'Nested Facet Child 2',
            description: 'Nested Facet Child 2 Description',
            count: 5,
            children: null,
          },
          {
            name: 'nested_facet_child_3',
            display: 'Nested Facet Child 3',
            description: 'Nested Facet Child 3 Description',
            count: 1,
            children: null,
          },
        ],
      },
      {
        name: 'nested_facet_2',
        display: 'Nested Facet 2',
        description: 'Nested Facet 2 Description',
        count: 1,
        children: null,
      },
      {
        name: 'nested_facet_3',
        display: 'Nested Facet 3',
        description: 'Nested Facet 3 Description',
        count: 10,
        children: [
          {
            name: 'nested_facet_child_4',
            display: 'Nested Facet Child 4',
            description: 'Nested Facet Child 4 Description',
            count: 1,
            children: null,
          },
          {
            name: 'nested_facet_child_5',
            display: 'Nested Facet Child 5',
            description: 'Nested Facet Child 5 Description',
            count: 1,
            children: null,
          },
          {
            name: 'nested_facet_child_6',
            display: 'Nested Facet Child 6',
            description: 'Nested Facet Child 6 Description',
            count: 5,
            children: null,
          },
          {
            name: 'nested_facet_child_7',
            display: 'Nested Facet Child 7',
            description: 'Nested Facet Child 7 Description',
            count: 3,
            children: null,
          },
        ],
      },
      {
        name: 'nested_facet_4',
        display: 'Nested Facet 4',
        description: 'Nested Facet 4 Description',
        count: 300,
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

export const sites = { sites: ['site A', 'site B'], homeSite: 'site A', homeDisplay: 'Site A' };
export const status = {
  genomic: 'Unsent',
  phenotypic: 'Unsent',
  queryId: '1234',
  approved: null,
  site: '',
};

export const metadata = {
  status: 'AVAILABLE',
  picsureResultId: '1234',
  resultMetadata: {
    queryResultMetadata: '{"picsureQueryId":"p1234"}',
    queryJson: {
      query: {
        categoryFilters: {},
        numericFilters: {},
        requiredFields: [],
        anyRecordOf: [],
        variantInfoFilters: [
          {
            categoryVariantInfoFilters: {},
            numericVariantInfoFilters: {},
          },
        ],
        expectedResultType: 'DATAFRAME',
      },
      resourceUUID: 'r1234',
      requesterEmail: 'Example@example.com',
      institutionOfOrigin: 'Unknown',
      commonAreaUUID: '1234',
    },
  },
};

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
