import { error, type NumericRange } from '@sveltejs/kit';
import { logout, login } from '$lib/stores/User';
import { browser } from '$app/environment';
import { get as getStore } from 'svelte/store';
import { page } from '$app/stores';
import { v4 as uuidv4 } from 'uuid';
import type { UUID } from 'crypto';
import type { EnvInfo, ErrorDetails, LogEntry, UserInfo } from './models/LogEntry';
import { environment } from '$lib/configuration';
import { user } from '$lib/stores/User';
import { PicsurePrivileges } from './models/Privilege';

const BEARER = 'Bearer ';
const BASE_METRICS_URL = 'picsure/proxy/metrics/v1/';

// TODO: fix any types
/* eslint-disable @typescript-eslint/no-explicit-any */
async function send({
  method,
  path,
  data,
  headers,
}: {
  method: string;
  path: string;
  data?: any; //TODO: Change this
  headers?: any;
}) {
  const opts: { method: string; headers: { [key: string]: string }; body?: string } = {
    method,
    headers: {},
  };

  if (data) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  if (headers) {
    opts.headers = { ...opts.headers, ...headers };
  }

  if (browser) {
    const token = localStorage.getItem('token');
    if (token) {
      opts.headers['Authorization'] = `${BEARER}${token}`;
      opts.headers['request-source'] = 'Authorized';
    }
    if (sessionStorage.getItem('sessionId')) {
      opts.headers['session-id'] = sessionStorage.getItem('sessionId') || '';
    }
    if (getStore(page).url.pathname.includes('/discover')) {
      opts.headers['request-source'] = 'Open';
    }
  }

  const res = await fetch(`${window.location.origin}/${path}`, opts);

  return await handleResponse(res);
}

export function get(path: string, headers?: any) {
  return send({ method: 'GET', path, headers });
}

export function del(path: string, headers?: any) {
  return send({ method: 'DELETE', path, headers });
}

export function post(path: string, data: any, headers?: any) {
  return send({ method: 'POST', path, data, headers });
}

export function put(path: string, data: any, headers?: any) {
  return send({ method: 'PUT', path, data, headers });
}

async function handleResponse(res: Response) {
  if (res.ok || res.status === 422) {
    refreshToken(res);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text; //TODO: Change this
    }
  } else if (res.status === 401) {
    browser &&
      sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in.');
    logout(undefined, true);
    return;
  } else if (res.status === 403) {
    if (browser) {
      sessionStorage.removeItem('logout-reason');
      sessionStorage.removeItem('filters');
    }
    logout(undefined, false);
    return;
  }

  throw error(res.status as NumericRange<400, 599>, await res.text());
}

function refreshToken(res: Response) {
  let newAuthToken = res.headers.get('Authorization');
  if (newAuthToken) {
    newAuthToken = newAuthToken.replace(BEARER, '');
    login(newAuthToken);
  }
}

export function collectMetics(
  action: string,
  actionMetadata?: Record<string, any>,
  otherMetadata?: Record<string, any>,
) {
  const env: EnvInfo = getEnvInfo();
  const userInfo: UserInfo = getUserInfo();
  const logEntry: LogEntry = {
    event_id: uuidv4() as UUID,
    action: action,
    action_metadata: actionMetadata,
    timestamp: new Date().toISOString(),
    user: userInfo,
    environment: env,
    other_metadata: otherMetadata,
  };
  post(BASE_METRICS_URL + 'actions', logEntry).catch((error) => {
    console.error('Error logging action: ' + error);
  });
}

export function logErrorForMetrics(
  action: string,
  actionMetadata?: Record<string, any>,
  otherMetadata?: Record<string, any>,
  errorDetails?: ErrorDetails,
) {
  const env: EnvInfo = getEnvInfo();
  const userInfo: UserInfo = getUserInfo();
  const logEntry: LogEntry = {
    event_id: uuidv4() as UUID,
    action: action,
    action_metadata: actionMetadata,
    timestamp: new Date().toISOString(),
    user: userInfo,
    environment: env,
    other_metadata: otherMetadata,
    error_details: errorDetails,
  };
  post(BASE_METRICS_URL + 'errors', logEntry);
}

function getUserInfo(): UserInfo {
  const currentUser = getStore(user);
  let userInfo: UserInfo;
  if (currentUser) {
    const userType = getUserType(currentUser.privileges || []);
    userInfo = {
      uuid: (currentUser.uuid as UUID) || undefined,
      email: currentUser.email || currentUser.userId,
      user_id: currentUser.userId || currentUser.email,
      logged_in: localStorage.getItem('token') !== null,
      type: userType,
      session_id: (sessionStorage.getItem('sessionId') as UUID) || undefined,
    };
  } else {
    userInfo = {
      uuid: uuidv4() as UUID,
      email: 'anonymous',
      user_id: 'anonymous',
      logged_in: false,
      type: 'Open Access User',
      session_id: (sessionStorage.getItem('sessionId') as UUID) || undefined,
    };
  }
  return userInfo;
}

function getUserType(privileges: string[]): string {
  if (privileges.includes(PicsurePrivileges.SUPER)) {
    return 'Super_Admin';
  } else if (privileges.includes(PicsurePrivileges.ADMIN)) {
    return 'Admin';
  } else if (privileges.includes(PicsurePrivileges.DATA_ADMIN)) {
    return 'Data Admin';
  } else if (privileges.includes(PicsurePrivileges.QUERY)) {
    return 'PIC-SURE User';
  }
  return 'Open Access User';
}

function getEnvInfo(): EnvInfo {
  return {
    domain: window.location.hostname,
    platform: environment.platform,
    env: environment.env,
    source: 'Web',
    user_agent: navigator.userAgent,
  };
}
