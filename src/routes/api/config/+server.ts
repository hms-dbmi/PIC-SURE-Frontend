import { json } from '@sveltejs/kit';
import { getConfig } from '$lib/server/configCache';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const config = await getConfig();
    return json(config);
  } catch (error) {
    return json({ error: 'Failed to load configuration' }, { status: 500 });
  }
};
