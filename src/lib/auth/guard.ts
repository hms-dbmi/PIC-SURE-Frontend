import { redirect, type LoadEvent } from '@sveltejs/kit';
import { browser } from '$app/env';
import { accessRedirect, type Access } from '#lib/auth/access.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { config } from '#lib/config/config.svelte.ts';

function checksProfile(policy: Access): boolean {
  return !!policy.anyOf || !!policy.topAdmin || (!!policy.within && checksProfile(policy.within));
}

/**
 * A route's guard: waits for the layouts above it and, when `policy` checks privileges, for the
 * session bootstrap, then redirects unless `policy` lets the visitor in. It only reads: the page
 * it redirects to acts on the reason in the URL (see `handleAccessReason`).
 */
export async function requireAccess(
  { url, parent }: Pick<LoadEvent, 'url' | 'parent'>,
  policy: Access,
): Promise<void> {
  // The root layout applies the config, and outer layouts run their guards first.
  await parent();
  if (browser && checksProfile(policy)) await session.bootstrap();
  const visitor = browser
    ? {
        signedIn: session.isLoggedIn,
        tokenValid: session.hasValidToken,
        user: session.user,
        profileFailed: session.profileFailed,
      }
    : undefined;
  const to = accessRedirect(policy, url, config.features, visitor);
  if (to) redirect(302, to);
}
