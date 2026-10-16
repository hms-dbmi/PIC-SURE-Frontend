import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// API keys moved into a tab on the configuration page; keep old links and bookmarks working.
export const load: PageLoad = () => {
  redirect(301, '/admin/configuration?tab=api-keys');
};
