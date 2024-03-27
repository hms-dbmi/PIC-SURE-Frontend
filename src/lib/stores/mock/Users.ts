// Mock api data to use until login flow is added. Excluded json data we could get but don't need -- excess fields
// recieved when setting response json object to data model will be ignored.
// TODO: Move these to the test mock-data folder when api has been inmplemented.

const _application = {
  picsure: {
    uuid: 'a1234',
    name: 'PICSURE',
    description: 'PIC-SURE multiple data access API',
    enable: true,
  },
  jupyter: {
    uuid: 'a2345',
    name: 'JupyterHub',
    description: 'JupyterHub authentication via PSAMA',
    enable: true,
  },
};

const _privileges = {
  superAdmin: {
    uuid: 'p1234',
    name: 'SUPER_ADMIN',
    description: 'PIC-SURE Auth super admin for managing roles/privileges/application/connections',
    queryScope: '[]',
  },
  admin: {
    uuid: 'p2345',
    name: 'ADMIN',
    description: 'PIC-SURE Auth admin for managing users.',
    queryScope: '[]',
  },
  anyQuery: {
    uuid: 'p3456',
    name: 'PIC_SURE_ANY_QUERY',
    description: 'User who cann run any PIC-SURE Query',
    queryScope: '[]',
    application: _application.picsure,
  },
  jupyter: {
    uuid: 'p4567',
    name: 'JUPYTER_USER',
    description: 'JupyterHub user for accessing notebooks',
    queryScope: '[]',
    application: _application.jupyter,
  },
};

const _roles = {
  topAdmin: {
    uuid: 'r1234',
    name: 'PIC-SURE Top Admin',
    description:
      'PIC-SURE Auth Micro App Top admin including Admin and super Admin, can manage roles and privileges directly',
    privileges: [_privileges.superAdmin, _privileges.admin],
  },
  user: {
    uuid: 'r2345',
    name: 'PIC-SURE User',
    description: 'Normal user, can run any query including data export.',
    privileges: [_privileges.anyQuery],
  },
  jupyterUser: {
    uuid: 'r3456',
    name: 'JupyterHub User',
    description: 'The user is able to access JupyterHub as a normal user',
    privileges: [_privileges.jupyter],
  },
  admin: {
    uuid: 'r4567',
    name: 'Admin',
    description:
      'Normal admin users, can manage other users including assignment of roles and privileges',
    privileges: [_privileges.admin],
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
    uuid: 'c1234',
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
    roles: [_roles.topAdmin, _roles.admin, _roles.user],
    email: 'abcd@test.com',
    connection: _connections.c1234,
    active: true,
  },
  {
    uuid: 'bcde',
    subject: _connections.c1234.subPrefix + 'bcde',
    roles: [_roles.topAdmin, _roles.admin, _roles.user],
    email: 'bcde@test.com',
    connection: _connections.c1234,
    active: true,
  },
  {
    uuid: 'cdef',
    roles: [_roles.admin, _roles.user],
    email: 'cdef@test.com',
    connection: _connections.c1234,
    generalMetadata: '{"email":"cdef@test.com"}',
    active: false,
  },
  {
    uuid: 'defg',
    roles: [_roles.user],
    email: 'defg@test.com',
    connection: _connections.c2345,
    generalMetadata: '{"email":"defg@test.com"}',
    active: true,
  },
  {
    uuid: 'efgh',
    roles: [_roles.user],
    email: 'efgh@test.com',
    connection: _connections.c1234,
    generalMetadata: '{"email":"efgh@test.com"}',
    active: false,
  },
  {
    uuid: 'fghi',
    subject: 'google-oauth2|fghi',
    roles: [_roles.user],
    email: 'fghi@test.com',
    connection: _connections.c1234,
    active: true,
  },
];
