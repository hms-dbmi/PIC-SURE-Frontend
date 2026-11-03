import { browser } from '$app/env';

/**
 * Browser-only singletons live in module scope, which the server shares between requests, so a
 * write during server rendering could leak one user's state into another user's page. Their
 * setters call this to fail loudly in development. Production builds compile it to nothing.
 */
export function assertNoSsrWrite(owner: string) {
  if (import.meta.env.DEV && !browser) {
    throw new Error(`${owner} is browser-only and was written during server rendering.`);
  }
}
