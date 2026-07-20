import { json } from '@sveltejs/kit';
import { getConfig } from '$lib/server/configCache';
import { Psama } from '$lib/paths';
import { PicsurePrivileges } from '$lib/models/Privilege';
import type { User } from '$lib/models/User';
import type { RequestHandler } from './$types';

const ORIGIN = import.meta.env?.VITE_ORIGIN;

export const GET: RequestHandler = async ({ request }) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let user: User;
  try {
    const res = await fetch(`${ORIGIN}/${Psama.User.Me}`, {
      method: 'GET',
      headers: { Authorization: authorization },
    });
    if (!res.ok) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    user = await res.json();
  } catch {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user.privileges?.includes(PicsurePrivileges.SUPER)) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // force = true so this actually fetches instead of serving whatever's cached.
    // getConfigKind only overwrites a kind's cache entry on a successful fetch (see
    // its comment in configCache.ts) - so a kind that fails here just keeps serving
    // its last known-good value instead of losing it.
    const config = await getConfig(true);
    return json(config);
  } catch (error) {
    return json({ error: 'Failed to load configuration' }, { status: 500 });
  }
};
