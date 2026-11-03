import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '#lib/api/errors.ts';
import { getDocumentedServices, getOpenApiDocument } from '#lib/api/picsure/openapi.ts';

const fetchMock = vi.fn();
const signal = new AbortController().signal;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('openapi', () => {
  it('lists the named services without credentials', async () => {
    fetchMock.mockResolvedValue(json([{ name: 'dictionary', url: 'x' }, { url: 'y' }]));

    await expect(getDocumentedServices(signal)).resolves.toEqual(['dictionary']);
    expect(fetchMock).toHaveBeenCalledWith(
      '/picsure/openapi',
      expect.objectContaining({ credentials: 'omit', redirect: 'error' }),
    );
  });

  it('rejects with the HTTP status', async () => {
    fetchMock.mockResolvedValue(json({}, 404));
    await expect(getDocumentedServices(signal)).rejects.toEqual(
      expect.objectContaining({ status: 404 }),
    );
    await expect(getDocumentedServices(signal)).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects a document that is not OpenAPI 3.0 or 3.1', async () => {
    fetchMock.mockResolvedValue(json({ swagger: '2.0', info: {}, paths: {} }));
    await expect(getOpenApiDocument('dictionary', signal)).rejects.toThrow(
      'Invalid OpenAPI document',
    );
    expect(fetchMock).toHaveBeenCalledWith('/picsure/openapi/dictionary', expect.anything());
  });
});
