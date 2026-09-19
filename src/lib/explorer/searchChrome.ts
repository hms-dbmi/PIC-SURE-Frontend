const SEARCH_ROOTS = ['/explorer', '/discover'];
const FULL_PAGE_SEGMENTS = ['/export', '/distributions'];

export function showsSearchChrome(pathname: string): boolean {
  if (!pathname) return false;
  return (
    SEARCH_ROOTS.some((root) => pathname.includes(root)) &&
    !FULL_PAGE_SEGMENTS.some((segment) => pathname.includes(segment))
  );
}
