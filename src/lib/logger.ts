import { browser } from '$app/environment';
import { Internal } from '$lib/paths';
import type { LogEvent } from '$lib/models/Log';
import { user, isUserLoggedIn } from '$lib/stores/User';
import { get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { PicsurePrivileges } from './models/Privilege';
import type { User } from './models/User';
import { routes } from '$lib/configuration';
// Registered lazily by Filter.ts to avoid circular dependency: Filter → logger → Filter
let _associatedStudies: import('svelte/store').Readable<string[]> | undefined;
export function registerAssociatedStudies(store: import('svelte/store').Readable<string[]>) {
  _associatedStudies = store;
}

const SESSION_ID_KEY = 'log_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

const RELEVANT_PRIVILEGES = new Set([
  PicsurePrivileges.SUPER,
  PicsurePrivileges.ADMIN,
  PicsurePrivileges.DATA_ADMIN,
  PicsurePrivileges.API_ACCESS,
]);

function getRelevantPrivileges(userData: User): string[] {
  return userData.privileges?.filter((p) => RELEVANT_PRIVILEGES.has(p as PicsurePrivileges)) ?? [];
}

export function log(event: LogEvent): void {
  if (!browser) return;

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  fetch(Internal.Log, {
    method: 'POST',
    headers,
    body: JSON.stringify(event),
  }).catch((err) => {
    console.warn('[logger] Failed to send log event:', err);
  });
}

export function createLog(
  eventType: string,
  action?: string,
  metadata?: Record<string, unknown>,
  overrides?: Partial<LogEvent>,
): LogEvent {
  const event: LogEvent = {
    _time: new Date().toISOString(),
    event_type: eventType,
    client_type: 'frontend',
    app: 'PIC-SURE',
  };
  if (action) event.action = action;
  const loggedIn = isUserLoggedIn();
  event.logged_in = loggedIn;
  if (loggedIn) {
    const userData = get(user) as User;
    const type = sessionStorage.getItem('type') ?? undefined;
    event.user_id = userData.userId ? userData.userId : userData.email;
    event.user_email = userData.email?.includes('@') ? userData.email : undefined;
    event.user_id_provider = type;
    event.roles = getRelevantPrivileges(userData);
    event.idp = sessionStorage.getItem('idp') || undefined;
  }
  if (metadata) event.metadata = metadata;
  const studies = _associatedStudies ? get(_associatedStudies) : undefined;
  event.associated_study = studies?.length ? studies : undefined;

  if (browser) {
    event.session_id = getSessionId();
    event.hostname = window.location.hostname;
    event.http_user_agent = navigator.userAgent;
    event.referrer = document.referrer || undefined;
    event.url = window.location.href;
    event.query_string = window.location.search;
  }

  if (overrides) Object.assign(event, overrides);

  return event;
}

export function getPageContext(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const path = window.location.pathname;
  if (path === '/') return 'Landing';
  if (path.startsWith('/login')) return 'Login';

  // Match against configured routes, longest path first
  const match = routes
    .filter((r) => path.startsWith(r.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return match?.text ?? 'Other';
}
