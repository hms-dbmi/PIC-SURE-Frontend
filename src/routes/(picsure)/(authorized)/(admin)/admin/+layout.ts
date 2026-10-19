import type { LayoutLoad } from './$types';
import { ACCESS, requireAccess } from '#lib/auth/access.ts';

export const prerender = false;

export const load: LayoutLoad = (event) => requireAccess(event, ACCESS.admin);
