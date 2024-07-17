import type { User } from '../src/lib/models/User';
import { PicsurePrivileges } from '../src/lib/models/Privilege';

export const HPDS = process.env.VITE_RESOURCE_HPDS;

export const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6OTYwOTU3Mjk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.M1W7a3jQNoHQxAUwfj3sDqyVtNH_DkRdzsIF3prIYQA';
export const mockExpiredToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6MTYxMjE2NDk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.kzaW-ZkhCPlTgdGQQAz_CA1ZB80PpZ5aiRa2lj46hbw';
export const mockLoginResponse =
  '/login/loading?redirectTo=/&provider=AUTH0#access_token=' +
  mockToken +
  '&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer&state=mNK7oJ5SLputhCuYrXYh5n4xEVQXhz6G';

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

export const picsureUser: User = {
  uuid: '1234',
  email: 'test@pic-sure.org',
  privileges: [PicsurePrivileges.QUERY],
  // expired token
  token: mockToken,
  acceptedTOS: true,
};

export const searchResultPath = 'picsure/proxy/dictionary-api/concepts?page_number=0&page_size=10';
export const facetResultPath = 'picsure/proxy/dictionary-api/facets/';
export const conceptsDetailPath = 'picsure/proxy/dictionary-api/concepts/detail/'; // + name

export const searchRequest = { facets: [], search: 'age' };

export const searchResults = {
  totalPages: 1,
  totalElements: 4,
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
      description: 'Do you have a history of heart attack? Including extended family?',
      values: ['Yes', 'No', "Don't know"],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\TEST\\questionnaire\\disease\\Any tests today?\\',
      name: 'MCQ300a',
      display: 'Any tests today?',
      dataset: '2',
      description: 'This is a test description?',
      values: ['Yes', 'No'],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\this\\is\\a\\age\\',
      name: 'age1',
      display: 'age',
      dataset: 'test_data_set',
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
      description: "Participant's age (category)",
      values: ['21', '22', '23', '24', '25'],
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
  dataset: 'test_data_set',
  description: 'Do you have a history of heart attack? Including extended family?',
  values: ['Yes', 'No', "Don't know"],
  children: null,
  meta: {
    values: ['Yes', 'No', "Don't know"],
    description: 'Do you have a history of heart attack? Including extended family?',
  },
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

export const facetsResponse = [
  {
    name: 'study_ids_dataset_ids',
    display: 'Study IDs/Dataset IDs',
    description: '',
    facets: [
      {
        name: 'study2',
        display: 'National Health and Nutrition Examination Survey',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs002715',
        display: 'NSRR CFS',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs000284',
        display: 'CFS',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'phs002385',
        display: 'HCT_for_SCD',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study1',
        display: 'Study Display 1',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study3',
        display: 'Study Display 3',
        description: null,
        count: 5,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study4',
        display: 'Study Display 4',
        description: null,
        count: 2,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study5',
        display: 'Study Display 5',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study6',
        display: 'Study Display 6',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study7',
        display: 'Study Display 7',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study8',
        display: 'Study Display 8',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
        meta: null,
      },
      {
        name: 'study9',
        display: 'Study Display 9',
        description: null,
        count: 1,
        children: null,
        category: 'study_ids_dataset_ids',
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
        description: null,
        count: 1,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet2',
        display: 'Facet 2',
        description: null,
        count: 4,
        children: null,
        category: 'another_category_name',
        meta: null,
      },
      {
        name: 'facet3',
        display: 'This is a really long facet name for testing',
        description: null,
        count: 1,
        children: null,
        category: 'another_category_name',
        meta: null,
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
  approved: '',
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
    },
  },
};

export const infoColumnDescriptions = {
  Variant_consequence_calculated: 'The calculated consequence of a variant.',
  Gene_with_variant: 'The official symbol for a gene affected by a variant.',
  Variant_severity: 'The severity for the calculated consequence of a variant on a gene.',
  Variant_frequency_as_text: 'The variant allele frequency in gnomAD.',
};

export const infoColumns = [
  {
    key: 'Variant_consequence_calculated',
    description: 'Description="' + infoColumnDescriptions.Variant_consequence_calculated + '"',
  },
  {
    key: 'Gene_with_variant',
    description: 'Description="' + infoColumnDescriptions.Gene_with_variant + '"',
  },
  {
    key: 'Variant_severity',
    description: 'Description="' + infoColumnDescriptions.Variant_severity + '"',
  },
  {
    key: 'Variant_frequency_as_text',
    description: 'Description="' + infoColumnDescriptions.Variant_frequency_as_text + '"',
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
  ],
  page: 1,
  total: 20,
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
