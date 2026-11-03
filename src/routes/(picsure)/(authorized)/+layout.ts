import type { LayoutLoad } from './$types';
import { ACCESS } from '#lib/auth/access.ts';
import { requireAccess } from '#lib/auth/guard.ts';

export const prerender = false;

export const load: LayoutLoad = (event) => requireAccess(event, ACCESS.authorized);
