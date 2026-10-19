import type { PageLoad } from './$types';
import { ACCESS } from '#lib/auth/access.ts';
import { requireAccess } from '#lib/auth/guard.ts';

export const load: PageLoad = (event) => requireAccess(event, ACCESS.dashboard);
