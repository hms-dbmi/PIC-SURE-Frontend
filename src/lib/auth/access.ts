import type { Features } from '#lib/config/index.ts';
import { PicsurePrivileges } from '#lib/auth/model/privilege.ts';
import type { Route } from '#lib/auth/model/route.ts';
import type { User } from '#lib/auth/model/user.ts';
import { routes } from '#lib/auth/nav.ts';

export function isTopAdmin(user: User): boolean {
  return user.privileges?.includes(PicsurePrivileges.SUPER) ?? false;
}

/** The nav routes `user` may open. Pass `undefined` for a signed-out visitor. */
export function routesFor(user: User | undefined, features: Features): Route[] {
  const privileges: string[] = user?.privileges ?? [];

  function featureRoutes(routeList: Route[]): Route[] {
    return routeList
      .filter((route) => (route.feature ? features[route.feature] : true))
      .map((route) =>
        route.children ? { ...route, children: featureRoutes(route.children) } : route,
      );
  }

  if (privileges.length === 0) {
    const openRoutes = featureRoutes(routes.filter((route) => !route.privilege));
    if (!user && features.login.open && !features.discover) {
      openRoutes.unshift({ path: '/explorer', text: 'Explore' });
    }
    return openRoutes;
  }

  const featured = featureRoutes(routes);
  if (privileges.includes(PicsurePrivileges.SUPER)) return featured;

  function allowedRoutes(routeList: Route[]): Route[] {
    return routeList
      .filter((route) => !route.privilege || route.privilege.some((p) => privileges.includes(p)))
      .map((route) =>
        route.children ? { ...route, children: allowedRoutes(route.children) } : route,
      );
  }
  return allowedRoutes(featured);
}
