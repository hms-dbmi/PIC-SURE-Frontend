import { getConfig } from '#lib/server/configCache.ts';
import { Psama, joinUrl } from '#lib/paths.ts';
import { PicsurePrivileges } from '#lib/models/Privilege.ts';
import type { User } from '#lib/models/User.ts';
import type { RequestHandler } from './$types';

const ORIGIN = import.meta.env?.VITE_ORIGIN;

export const GET: RequestHandler = async ({ request }) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ORIGIN) {
    console.error('Config refresh failed: VITE_ORIGIN is not configured.');
    return Response.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let user: User;
  try {
    const target = joinUrl(ORIGIN, Psama.User.Me);
    const res = await fetch(target, {
      method: 'GET',
      headers: { Authorization: authorization },
    });
    if (!res.ok) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const text = await res.text();
    user = JSON.parse(text);
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user.privileges?.includes(PicsurePrivileges.SUPER)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // force = true so this actually fetches instead of serving whatever's cached.
    // getConfigKind only overwrites a kind's cache entry on a successful fetch (see
    // its comment in configCache.ts) - so a kind that fails here just keeps serving
    // its last known-good value instead of losing it.
    const config = await getConfig(true);
    return Response.json(config);
  } catch {
    return Response.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
};
