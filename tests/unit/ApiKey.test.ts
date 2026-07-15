import { describe, it, expect } from 'vitest';

import {
  getApiKeyStatus,
  formatInstant,
  toPlatformKeyRequest,
  extractApiError,
  type ApiKeyMetadata,
} from '$lib/models/ApiKey';

const baseKey: ApiKeyMetadata = {
  uuid: 'uuid-1',
  displayPrefix: 'abc12345',
  keyType: 'USER',
  name: null,
  email: null,
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: null,
  revokedAt: null,
  lastUsedAt: null,
};

const now = new Date('2026-07-14T12:00:00Z');

describe('getApiKeyStatus', () => {
  it('returns Active for a key with no revocation and no expiry', () => {
    expect(getApiKeyStatus(baseKey, now)).toBe('Active');
  });

  it('returns Active for a key expiring in the future', () => {
    const key = { ...baseKey, expiresAt: '2027-01-01T00:00:00Z' };
    expect(getApiKeyStatus(key, now)).toBe('Active');
  });

  it('returns Expired when expiresAt is in the past', () => {
    const key = { ...baseKey, expiresAt: '2026-01-02T00:00:00Z' };
    expect(getApiKeyStatus(key, now)).toBe('Expired');
  });

  it('returns Revoked when revokedAt is set', () => {
    const key = { ...baseKey, revokedAt: '2026-06-01T00:00:00Z' };
    expect(getApiKeyStatus(key, now)).toBe('Revoked');
  });

  it('prefers Revoked over Expired when both apply', () => {
    const key = {
      ...baseKey,
      revokedAt: '2026-06-01T00:00:00Z',
      expiresAt: '2026-01-02T00:00:00Z',
    };
    expect(getApiKeyStatus(key, now)).toBe('Revoked');
  });
});

describe('formatInstant', () => {
  it('formats an ISO instant as a YYYY-MM-DD date', () => {
    expect(formatInstant('2026-03-05T12:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('renders a midnight-UTC instant as that UTC calendar day regardless of local timezone', () => {
    // west of UTC this rolls back to 2025-12-31 unless formatted in UTC
    const original = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      expect(formatInstant('2026-01-01T00:00:00Z')).toBe('2026-01-01');
    } finally {
      process.env.TZ = original;
    }
  });

  it('returns the fallback for null and undefined', () => {
    expect(formatInstant(null, 'Never')).toBe('Never');
    expect(formatInstant(undefined, 'Never')).toBe('Never');
  });

  it('returns the fallback for an unparseable instant', () => {
    expect(formatInstant('not-a-date', '—')).toBe('—');
  });
});

describe('toPlatformKeyRequest', () => {
  it('trims name and email', () => {
    expect(toPlatformKeyRequest(' Pipeline ', ' ops@example.org ')).toEqual({
      name: 'Pipeline',
      email: 'ops@example.org',
    });
  });

  it('omits expiresAt when no expiry date is given', () => {
    const request = toPlatformKeyRequest('Pipeline', 'ops@example.org', '');
    expect('expiresAt' in request).toBe(false);
  });

  it('converts a date input value to a UTC start-of-day instant', () => {
    expect(toPlatformKeyRequest('Pipeline', 'ops@example.org', '2027-01-01').expiresAt).toBe(
      '2027-01-01T00:00:00Z',
    );
  });
});

describe('extractApiError', () => {
  it('unwraps a JSON error body from an HttpError message', () => {
    const error = {
      status: 400,
      body: { message: JSON.stringify({ errorType: 'error', message: 'Expiry must be future' }) },
    };
    expect(extractApiError(error)).toBe('Expiry must be future');
  });

  it('returns a plain-text error message as-is', () => {
    const error = { status: 400, body: { message: 'plain failure' } };
    expect(extractApiError(error)).toBe('plain failure');
  });

  it('falls back for errors without a message', () => {
    expect(extractApiError(new TypeError('boom'), 'fallback')).toBe('fallback');
    expect(extractApiError(undefined, 'fallback')).toBe('fallback');
  });
});
