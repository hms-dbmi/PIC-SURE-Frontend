import { ApiError } from '#lib/api/errors.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';

const TIMEOUT_MS = 15000;

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string } & Record<string, unknown>;
  paths: Record<string, unknown>;
  [key: string]: unknown;
}

/** The names of the services that publish an OpenAPI document. */
export async function getDocumentedServices(signal: AbortSignal): Promise<string[]> {
  const registry = await getJson(`/${Picsure.OpenApi}`, signal);
  if (!Array.isArray(registry)) throw new Error('Invalid documentation registry');
  return registry.flatMap((entry) =>
    isObject(entry) && typeof entry.name === 'string' ? [entry.name] : [],
  );
}

/** A service's OpenAPI 3.0 or 3.1 document. */
export async function getOpenApiDocument(
  service: string,
  signal: AbortSignal,
): Promise<OpenApiDocument> {
  const document = await getJson(`/${PicsurePaths.openApiDocument(service)}`, signal);
  if (
    !isObject(document) ||
    typeof document.openapi !== 'string' ||
    !/^3\.(0|1)\./.test(document.openapi) ||
    !isObject(document.info) ||
    typeof document.info.title !== 'string' ||
    typeof document.info.version !== 'string' ||
    !isObject(document.paths)
  ) {
    throw new Error('Invalid OpenAPI document');
  }
  return document as OpenApiDocument;
}

// Public documents, read without the client: no credentials (no token, no cookies, no open-access
// session), so a failure here never touches the session, and a 15 s cap on each request.
async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  const requestController = new AbortController();
  const abort = () => requestController.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      signal: requestController.signal,
      credentials: 'omit',
      redirect: 'error',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'http', undefined, 'Documentation request failed');
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
