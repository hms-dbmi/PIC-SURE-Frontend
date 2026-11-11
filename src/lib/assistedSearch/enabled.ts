import { fromStore } from 'svelte/store';

import { config } from '$lib/configuration.svelte';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { user } from '$lib/stores/User';

// Reactive inside $derived, so a login or logout shows or hides the toggle without a reload.
const currentUser = fromStore(user);

/**
 * Whether the selected user group includes the current user, checked the way `userRoutes` checks
 * a route's privileges: any one listed privilege will do, and super admins are always in. With
 * no group configured the assistant is for everyone.
 */
function inSelectedGroup(): boolean {
  const group = config.settings.assistedSearch.privileges;
  if (group.length === 0) return true;
  const held = currentUser.current?.privileges ?? [];
  return held.includes(PicsurePrivileges.SUPER) || group.some((p) => held.includes(p));
}

export function assistedSearchEnabled(discover: boolean): boolean {
  const flag = discover
    ? config.features.enableAssistedSearchDiscover
    : config.features.enableAssistedSearch;
  return flag && inSelectedGroup();
}
