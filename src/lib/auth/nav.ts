import { ACCESS, admits, type Access } from '#lib/auth/access.ts';
import type { User } from '#lib/auth/model/user.ts';
import type { Features } from '#lib/config/index.ts';

export interface Route {
  path: string;
  text: string;
  /** The policy of the page the link opens. The link shows to the visitors it lets in. */
  access: Access;
  /** Who sees the nav link instead, when that isn't who `access` lets in. */
  visibleTo?: (user: User | undefined, features: Features) => boolean;
}

const explore = { path: '/explorer', text: 'Explore', access: ACCESS.explorer };

// Explore's nav links don't follow its guard, which lets any signed-in user in, until it's decided
// which rule is right. Signed-out visitors get it first, unless Discover is on; signed-in users
// get it in its place, with query access.
export const routes: Route[] = [
  { ...explore, visibleTo: (user, features) => !user && !features.discover },
  { path: '/dashboard', text: 'Data Dashboard', access: ACCESS.dashboard },
  { path: '/discover', text: 'Discover', access: ACCESS.discover },
  {
    ...explore,
    visibleTo: (user, features) => !!user && admits(ACCESS.authorized, features, user),
  },
  { path: '/api', text: 'API', access: ACCESS.api },
  { path: '/dataset', text: 'Manage Datasets', access: ACCESS.dataset },
  { path: '/admin/configuration', text: 'Configuration', access: ACCESS.admin },
  { path: '/admin/users', text: 'Manage Users', access: ACCESS.admin },
  { path: '/help', text: 'Help', access: ACCESS.app },
];

/** The nav routes to show `user`. Pass `undefined` for a signed-out visitor. */
export function routesFor(user: User | undefined, features: Features): Route[] {
  if (!admits(ACCESS.app, features, user)) return [];
  return routes.filter((route) =>
    route.visibleTo ? route.visibleTo(user, features) : admits(route.access, features, user),
  );
}

// Pages below a nav page whose guard is stricter than the nav page's.
const topAdminPages = ['connection', 'privilege', 'role'].map((kind) => ({
  path: `/admin/configuration/${kind}`,
  access: ACCESS.topAdmin,
}));

/**
 * Whether to show `user` a link to `href`. A link to a nav page, or a page below one, shows to the
 * visitors that page's policy lets in; links anywhere else always show.
 */
export function showsLink(href: string, user: User | undefined, features: Features): boolean {
  const [path] = href.split(/[?#]/);
  const within = (page: { path: string }) => path === page.path || path.startsWith(`${page.path}/`);
  const page = topAdminPages.find(within) ?? routes.find(within);
  return !page || (admits(ACCESS.app, features, user) && admits(page.access, features, user));
}
