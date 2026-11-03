import type { LayoutLoad } from './$types';
import { ACCESS } from '#lib/auth/access.ts';
import { requireAccess } from '#lib/auth/guard.ts';

export const load: LayoutLoad = async (event) => {
  await requireAccess(event, ACCESS.discover);
  return { mode: 'discover' as const };
};
