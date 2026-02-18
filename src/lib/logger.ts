import { browser } from '$app/environment';
import { Internal } from '$lib/paths';
import type { LogEvent } from '$lib/models/Log';
import { user, isUserLoggedIn } from '$lib/stores/User';
import { get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { PicsurePrivileges } from './models/Privilege';
import type { User } from './models/User';
import { associatedStudies } from '$lib/stores/Filter';

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

  fetch(`/${Internal.Log}`, {
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
    event_type: eventType,
    client_type: 'frontend',
    app: 'PIC-SURE',
    status: 200,
  };
  if (action) event.action = action;
  const loggedIn = isUserLoggedIn();
  event.logged_in = loggedIn;
  if (loggedIn) {
    const userData = get(user) as User;
    const type = sessionStorage.getItem('type') ?? undefined;
    event.user_id = userData.userId ? userData.userId : userData.email;
    event.user_email = userData.email?.includes('@') ? userData.email : undefined;
    event.eRA_commons_id = type === 'RAS' ? userData.email : undefined;
    event.user_id_provider = type;
    event.roles = getRelevantPrivileges(userData);
    event.idp = sessionStorage.getItem('idp') || undefined;
  }
  if (metadata) event.metadata = metadata;
  event.associated_study = get(associatedStudies);

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
