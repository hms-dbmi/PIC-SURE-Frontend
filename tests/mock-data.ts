import type { User } from '$lib/models/User';

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

export const user: User = {
  uuid: '1234',
  email: 'test@pic-sure.org',
  privileges: ['user'],
  roles: ['user'],
  // expired token
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNjEyMTY0OTgyLCJpYXQiOjE2MDk1NzI5ODJ9.wzXW7OBk0crFFGD2j9avij-sfWpcIvruSj55j2-oXxo',
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
      },
      '\\some\\test\\lab2\\': {
        name: '\\some\\test\\lab2\\',
        categorical: true,
        patientCount: 8971,
      },
    },
  },
};
