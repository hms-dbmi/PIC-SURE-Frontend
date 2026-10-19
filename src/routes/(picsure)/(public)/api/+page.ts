import type { PageLoad } from './$types';
import { ACCESS, requireAccess } from '#lib/auth/access.ts';

export const load: PageLoad = (event) => requireAccess(event, ACCESS.api);
