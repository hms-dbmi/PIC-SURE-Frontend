import { config } from '#lib/config/config.svelte.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { PicsurePrivileges } from '#lib/auth/model/privilege.ts';

/**
 * Whether the assistant is on for this page: the deployment offers it (the feature flag for
 * Explorer or Discover) and the signed-in user holds the assisted-search privilege. Roles grant the
 * privilege, so a logged-out visitor never sees it, and a deployment that doesn't want the
 * feature switches it off whatever its roles grant. Reads the session, so inside `$derived` a
 * login or logout shows or hides the toggle without a reload.
 */
export function assistedSearchEnabled(discover: boolean): boolean {
  const offered = discover
    ? config.features.enableAssistedSearchDiscover
    : config.features.enableAssistedSearch;
  const held = session.privileges;
  return offered && held.includes(PicsurePrivileges.ASSISTED_SEARCH);
}
