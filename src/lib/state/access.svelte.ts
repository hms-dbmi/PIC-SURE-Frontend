import * as api from '$lib/api';
import type { ConsentsMap } from '$lib/models/User';
import { Psama } from '$lib/paths';
import { onSessionChange, session } from './session.svelte';

export const ACCESS_UNAVAILABLE_MESSAGE =
  'We could not load which studies you have access to. Studies you are authorized for may not ' +
  'be shown, and searching the data dictionary is unavailable. Please try again. ' +
  'If the problem persists, please contact an administrator.';

export class AccessUnavailableError extends Error {
  constructor(cause: unknown) {
    super(ACCESS_UNAVAILABLE_MESSAGE, { cause });
    this.name = 'AccessUnavailableError';
  }
}

export class SessionChangedError extends Error {
  constructor() {
    super('The session changed while loading access.');
    this.name = 'AbortError';
  }
}

type AccessState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; consents: ConsentsMap }
  | { status: 'error'; error: AccessUnavailableError };

let state = $state.raw<AccessState>({ status: 'idle' });
let revision = $state(0);
let pending: Promise<ConsentsMap> | undefined;
let controller: AbortController | undefined;

export const access = {
  get state() {
    return state;
  },
  get consents() {
    return state.status === 'ready' ? state.consents : undefined;
  },
  get revision() {
    return revision;
  },
};

onSessionChange(() => {
  controller?.abort();
  controller = undefined;
  pending = undefined;
  state = { status: 'idle' };
});

async function fetchConsents(version: number, signal: AbortSignal): Promise<ConsentsMap> {
  const assertCurrent = () => {
    if (signal.aborted || session.revision !== version) throw new SessionChangedError();
  };
  // Retry once immediately, then back off before the final attempt.
  for (const delay of [0, 0, 3_000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    assertCurrent();
    try {
      const response = await api.get(Psama.User.Consents, undefined, undefined, { signal });
      assertCurrent();
      // An empty map is a successful response for deployments without a consent model.
      // Missing/malformed responses must not turn into an unfiltered dictionary request.
      const consents: unknown = response?.consents;
      if (
        !consents ||
        typeof consents !== 'object' ||
        Array.isArray(consents) ||
        !Object.values(consents).every(
          (values) => Array.isArray(values) && values.every((value) => typeof value === 'string'),
        )
      ) {
        throw new Error('Invalid consent response');
      }
      return consents as ConsentsMap;
    } catch (error) {
      assertCurrent();
      if (delay) throw new AccessUnavailableError(error);
    }
  }
  throw new Error('Unreachable');
}

export function ensureAccess({ retry = false } = {}): Promise<ConsentsMap> {
  if (!session.authenticated) return Promise.resolve({});
  if (pending) return pending;
  if (state.status === 'ready') return Promise.resolve(state.consents);
  if (state.status === 'error' && !retry) return Promise.reject(state.error);

  if (retry) revision++;
  state = { status: 'loading' };
  const version = session.revision;
  controller = new AbortController();
  const signal = controller.signal;
  const request = Promise.resolve()
    .then(() => fetchConsents(version, signal))
    .then((consents) => {
      if (session.revision !== version) throw new SessionChangedError();
      state = { status: 'ready', consents };
      return consents;
    })
    .catch((error: unknown) => {
      if (session.revision !== version) throw new SessionChangedError();
      const failure =
        error instanceof AccessUnavailableError ? error : new AccessUnavailableError(error);
      state = { status: 'error', error: failure };
      throw failure;
    })
    .finally(() => {
      if (pending === request) {
        pending = undefined;
        controller = undefined;
      }
    });
  pending = request;
  return request;
}
