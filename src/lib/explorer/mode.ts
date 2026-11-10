import { page } from '$app/state';
import type { RouteId } from '$app/types';
import { session } from '#lib/auth/session.svelte.ts';
import { browser } from '$app/env';
import { config } from '#lib/config/config.svelte.ts';

export type ExploreMode = 'explorer' | 'discover';

/** The explorer and discover layouts set the mode; every other page has none. */
export function exploreMode(): ExploreMode | undefined {
  return page.data.mode;
}

const MODE_ROUTES: Record<ExploreMode, RouteId> = {
  explorer: '/(picsure)/(public)/explorer',
  discover: '/(picsure)/(public)/discover',
};

/** The mode a route will have once its layout loads, for navigation guards that run before it. */
export function routeMode(routeId: RouteId | null | undefined): ExploreMode | undefined {
  if (!routeId) return undefined;
  return (Object.keys(MODE_ROUTES) as ExploreMode[]).find(
    (mode) => routeId === MODE_ROUTES[mode] || routeId.startsWith(`${MODE_ROUTES[mode]}/`),
  );
}

export function isOpenAccess(): boolean {
  return (browser && exploreMode() === 'discover') || !session.isLoggedIn;
}

export function isExploreWithoutLogin(): boolean {
  return Boolean(config.features.explorer.open && config.features.login.open);
}

export function useOpenAccess(isOpen?: boolean) {
  let openAccess = isOpen;
  if (typeof openAccess === 'undefined') {
    openAccess = isOpenAccess();
  }
  return openAccess && !isExploreWithoutLogin();
}
