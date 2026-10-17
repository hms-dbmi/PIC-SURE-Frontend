// Single source of truth for the login redirect contract: every place that sends
// an unauthenticated user to /login must capture pathname + search so their
// state (e.g. explorer search params) survives the round trip through login.
export function loginRedirectPath(url: { pathname: string; search: string }): string {
  return `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
}
