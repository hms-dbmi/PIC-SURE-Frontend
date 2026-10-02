import { getConfig } from '#lib/server/configCache.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const config = await getConfig();
    return Response.json(config);
  } catch {
    return Response.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
};
