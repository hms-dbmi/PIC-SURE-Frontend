import type { User } from '../src/lib/models/User';
import { PicsurePrivileges } from '../src/lib/models/Privilege';

export const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6MTYxMjE2NDk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.kzaW-ZkhCPlTgdGQQAz_CA1ZB80PpZ5aiRa2lj46hbw';
export const mockLoginResponse =
  '/login/loading?redirectTo=/#access_token=' +
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

export const picsureAdmin: User = {
  uuid: '1234',
  email: 'admin@pic-sure.org',
  privileges: [PicsurePrivileges.QUERY, PicsurePrivileges.ADMIN],
  // expired token
  token: mockToken,
  acceptedTOS: true,
};

export const topAdmin: User = {
  uuid: '1234',
  email: 'admin@pic-sure.org',
  privileges: [PicsurePrivileges.QUERY, PicsurePrivileges.SUPER],
  // expired token
  token: mockToken,
  acceptedTOS: true,
};

export const searchResultPath = '*/**/picsure/search/bf638674-053b-46c4-96a1-4cd6c8395248';
export const searchResults = {
  results: {
    phenotypes: {
      '\\some\\test\\lab1\\': {
        name: '\\some\\test\\lab1\\',
        categorical: true,
        patientCount: 9499,
        categoryValues: [
          'name',
          'test',
          'value45364',
          '34234234234234',
          'test2',
          'value334535352',
          'A very looooooooooooong value for testing to test really long values with in the ui and other stuff like that, we need a very loooooooong wooooooooooooord to test with.',
          'a',
          '22',
          'value1',
          'value2',
          'value3',
          'value4',
          'value5',
          'value6',
          'value7',
          'value8',
          'value9',
          'value10',
          'value11',
          'value12',
          'value13',
          'value14',
          'value15',
          'value16',
          'value17',
          'value18',
          'value19',
          'value20',
          'value21',
          'value22',
          'value23',
          'value24',
          'value25',
          'value26',
          'value27',
          'value28',
          'value29',
          'value30',
          'value31',
          'value32',
          'value33',
          'value34',
          'value35',
          'value36',
          'value37',
          'value38',
          'value39',
          'value40',
          'value41',
          'value42',
          'value43',
          'value44',
          'value45',
          'value46',
          'value47',
          'value48',
          'value49',
          'value50',
          'value51',
          'value52',
          'value53',
          'value54',
          'value55',
          'value56',
          'value57',
          'value58',
          'value59',
          'value60',
        ],
      },
      '\\some\\test\\lab2\\': {
        name: '\\some\\test\\lab2\\',
        categorical: true,
        patientCount: 8971,
        categoryValues: ['value1', 'value2', 'value3'],
      },
      '\\some\\test\\numerical\\': {
        name: '\\some\\test\\numerical\\',
        categorical: false,
        patientCount: 222,
        min: 11,
        max: 99,
      },
    },
  },
};

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
