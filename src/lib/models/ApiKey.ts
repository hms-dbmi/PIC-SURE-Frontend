export type ApiKeyType = 'USER' | 'PLATFORM';
export type ApiKeyStatus = 'Active' | 'Revoked' | 'Expired';

export interface ApiKeyMetadata {
  uuid: string;
  displayPrefix: string;
  keyType: ApiKeyType;
  name: string | null;
  email: string | null;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
}

export interface ApiKeyPage {
  keys: ApiKeyMetadata[];
  totalCount: number;
  page: number;
  size: number;
}

export interface PlatformKeyRequest {
  name: string;
  email: string;
  expiresAt?: string;
  neverExpires?: boolean;
}

export type PlatformKeyExpiry =
  | { mode: 'default' }
  | { mode: 'date'; date: string }
  | { mode: 'never' };

export interface MintedPlatformKey {
  apiKey: string;
  uuid: string;
  displayPrefix: string;
  keyType: ApiKeyType;
  expiresAt: string | null;
}

export function getApiKeyStatus(key: ApiKeyMetadata, now: Date = new Date()): ApiKeyStatus {
  if (key.revokedAt) return 'Revoked';
  if (key.expiresAt && new Date(key.expiresAt) < now) return 'Expired';
  return 'Active';
}

export function formatInstant(instant: string | null | undefined, fallback = ''): string {
  if (!instant) return fallback;
  const dt = new Date(instant);
  if (isNaN(dt.getTime())) return fallback;
  // format in UTC: these are date-only displays of midnight-UTC instants (expiry, created),
  // so local-timezone rendering would show the previous day west of UTC
  const year = dt.toLocaleString('default', { year: 'numeric', timeZone: 'UTC' });
  const month = dt.toLocaleString('default', { month: '2-digit', timeZone: 'UTC' });
  const day = dt.toLocaleString('default', { day: '2-digit', timeZone: 'UTC' });
  return `${year}-${month}-${day}`;
}

export function toPlatformKeyRequest(
  name: string,
  email: string,
  expiry: PlatformKeyExpiry = { mode: 'default' },
): PlatformKeyRequest {
  const request: PlatformKeyRequest = { name: name.trim(), email: email.trim() };
  if (expiry.mode === 'date' && expiry.date) {
    request.expiresAt = `${expiry.date}T00:00:00Z`;
  } else if (expiry.mode === 'never') {
    request.neverExpires = true;
  }
  return request;
}

export function extractApiError(
  error: unknown,
  fallback = 'Something went wrong when sending your request.',
): string {
  const message = (error as { body?: { message?: string } })?.body?.message;
  if (!message) return fallback;
  try {
    // PSAMA 400s arrive as a JSON body serialized into the error message
    const parsed = JSON.parse(message);
    return parsed?.message || fallback;
  } catch {
    return message;
  }
}
