import type { Role } from '$lib/models/Role';
import type { Connection } from '$lib/models/Connection';
import type { FormSchema } from '$lib/utilities/Validation';

/** Consent concept path (e.g. `\_consents\`) to the study identifiers granted under it. */
export type ConsentsMap = Record<string, string[]>;

export interface User {
  uuid?: string;
  email?: string;
  userId?: string;
  privileges?: string[];
  queryScopes?: string[];
  token?: string;
  acceptedTOS?: boolean;
  readonly consents?: ConsentsMap;
}

export interface ExtendedUser extends User {
  subject?: string;
  connection: string;
  generalMetadata: string;
  active: boolean;
  roles: string[];
}

export interface OktaUser extends User {
  readonly oktaIdToken: string;
}

export interface UserRequest extends User {
  connection?: Connection;
  generalMetadata: string;
  active: boolean;
  roles?: Role[];
}

export const defaultRegisterFormFields: FormSchema = {
  email: {
    label: 'Email',
    placeholder: 'Email',
    section: 'Your details',
    width: 'full',
    rules: [
      'string',
      'required',
      'regex:/^(?:[A-Za-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]*[A-Za-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])/',
    ],
  },
  firstName: {
    label: 'First Name',
    placeholder: 'First Name',
    section: 'Your details',
    rules: 'string|required|between:1,500',
  },
  lastName: {
    label: 'Last Name',
    placeholder: 'Last Name',
    section: 'Your details',
    rules: 'string|required|between:1,500',
  },
};

// TODO: Replace metadata and query types
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapExtendedUser(data: any) {
  return {
    ...data,
    connection: data.connection ? data.connection.uuid : '',
    roles: data.roles ? data.roles.map((r: any) => r.uuid) : [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
