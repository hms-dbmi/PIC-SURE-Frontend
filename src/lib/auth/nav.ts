import { ACCESS, admits } from '#lib/auth/access.ts';
import type { Route } from '#lib/auth/model/route.ts';
import type { User } from '#lib/auth/model/user.ts';
import type { Features } from '#lib/config/index.ts';

export const routes: Route[] = [
  { path: '/dashboard', text: 'Data Dashboard', access: ACCESS.dashboard },
  { path: '/discover', text: 'Discover', access: ACCESS.discover },
  {
    path: '/explorer',
    text: 'Explore',
    access: ACCESS.explorer,
    // The link doesn't follow the guard, which lets any signed-in user in: signed-in users see it
    // with query access, and signed-out visitors unless Discover is on.
    visibleTo: (user, features) =>
      user ? admits(ACCESS.authorized, features, user) : !features.discover,
  },
  { path: '/api', text: 'API', access: ACCESS.api },
  { path: '/dataset', text: 'Manage Datasets', access: ACCESS.dataset },
  { path: '/admin/configuration', text: 'Configuration', access: ACCESS.admin },
  { path: '/admin/users', text: 'Manage Users', access: ACCESS.admin },
  { path: '/help', text: 'Help', access: ACCESS.app },
];

function visible(route: Route, user: User | undefined, features: Features): boolean {
  return route.visibleTo ? route.visibleTo(user, features) : admits(route.access, features, user);
}

/** The nav routes to show `user`. Pass `undefined` for a signed-out visitor. */
export function routesFor(user: User | undefined, features: Features): Route[] {
  if (!admits(ACCESS.app, features, user)) return [];
  return routes.filter((route) => visible(route, user, features));
}

/**
 * Whether to show `user` a link to `href`. A link into a nav section shows only when that section's
 * nav link does; links elsewhere always show.
 */
export function showsLink(href: string, user: User | undefined, features: Features): boolean {
  const [path] = href.split(/[?#]/);
  const route = routes.find((route) => path === route.path || path.startsWith(`${route.path}/`));
  return !route || routesFor(user, features).includes(route);
}
