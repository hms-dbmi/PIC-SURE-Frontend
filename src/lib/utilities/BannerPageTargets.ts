import { BANNER_PAGE_TARGET_KINDS, type BannerPageTarget } from '$lib/models/Banner';

const parameterSegment = /^\[[A-Za-z_][A-Za-z0-9_]*\]$/;
const canonicalKindOrder = new Map(BANNER_PAGE_TARGET_KINDS.map((kind, index) => [kind, index]));

export function validateBannerPageTarget(target: BannerPageTarget): string | null {
  if (target.kind === 'ALL') return null;

  const path = trimOuterSpaces(target.path);
  if (path.includes('\\') || [...path].some(isControlCharacter))
    return 'The pathname contains unsupported characters.';
  if (!path.startsWith('/')) return 'Enter an absolute path starting with /.';
  if (path.includes('?') || path.includes('#'))
    return 'Enter a pathname without a query or fragment.';

  const normalizedPath = normalizePathname(path);
  const segments = normalizedPath === '/' ? [] : normalizedPath.slice(1).split('/');
  if (segments.some((segment) => segment === '')) return 'Remove empty path segments.';
  if (segments.some((segment) => segment === '.' || segment === '..'))
    return 'Remove . and .. path segments.';

  if (target.kind === 'SUBTREE' && normalizedPath === '/')
    return 'Choose All pages instead of a root subtree.';
  if (target.kind === 'SUBTREE' && segments.some((segment) => segment.includes('*')))
    return 'Do not add wildcard syntax to a subtree path.';

  if (target.kind === 'PARAMETERIZED') {
    let hasParameter = false;
    for (const segment of segments) {
      if (parameterSegment.test(segment)) {
        hasParameter = true;
      } else if (segment.includes('[') || segment.includes(']') || segment.includes('*')) {
        return 'Only plain [name] parameter segments are supported.';
      }
    }
    return hasParameter ? null : 'Add at least one plain [name] segment.';
  }

  if (segments.some((segment) => segment.includes('[') || segment.includes(']')))
    return 'Use Parameterized for paths containing [name] segments.';
  if (segments.some((segment) => segment.includes('*')))
    return 'Do not add wildcard syntax to a page path.';
  return null;
}

export function normalizeBannerPageTargets(targets: BannerPageTarget[]): BannerPageTarget[] {
  if (targets.length === 0) throw new Error('Add at least one page target.');
  if (targets.some((target) => target.kind === 'ALL')) {
    if (!targets.every((target) => target.kind === 'ALL'))
      throw new Error('All pages cannot be combined with targeted pages.');
    return [{ kind: 'ALL' }];
  }

  const targeted = targets.filter(
    (target): target is Exclude<BannerPageTarget, { kind: 'ALL' }> => target.kind !== 'ALL',
  );
  const normalized = targeted.map((target) => {
    const error = validateBannerPageTarget(target);
    if (error) throw new Error(error);
    return { ...target, path: normalizePathname(trimOuterSpaces(target.path)) };
  });
  const unique = new Map(normalized.map((target) => [`${target.kind}\0${target.path}`, target]));
  return [...unique.values()].sort(
    (left, right) =>
      (canonicalKindOrder.get(left.kind) ?? Number.MAX_SAFE_INTEGER) -
        (canonicalKindOrder.get(right.kind) ?? Number.MAX_SAFE_INTEGER) ||
      compareText(left.path, right.path),
  );
}

export function matchesBannerPageTargets(
  targets: BannerPageTarget[],
  pathnameWithOptionalQueryOrFragment: string,
): boolean {
  const pathname = normalizePathname(pathnameWithOptionalQueryOrFragment);
  return targets.some((target) => {
    if (target.kind === 'ALL') return true;
    if (target.kind === 'EXACT') return pathname === target.path;
    if (target.kind === 'SUBTREE')
      return pathname === target.path || pathname.startsWith(`${target.path}/`);

    const targetSegments = target.path.slice(1).split('/');
    const pathnameSegments = pathname === '/' ? [] : pathname.slice(1).split('/');
    return (
      targetSegments.length === pathnameSegments.length &&
      targetSegments.every(
        (segment, index) =>
          (parameterSegment.test(segment) && pathnameSegments[index].length > 0) ||
          segment === pathnameSegments[index],
      )
    );
  });
}

export function parseBannerPageTargets(value: unknown): BannerPageTarget[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const targets: BannerPageTarget[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    const fields = Object.keys(candidate);
    const target = candidate as Record<string, unknown>;
    if (target.kind === 'ALL') {
      if (fields.length !== 1) return null;
      targets.push({ kind: 'ALL' });
    } else if (
      (target.kind === 'EXACT' || target.kind === 'SUBTREE' || target.kind === 'PARAMETERIZED') &&
      typeof target.path === 'string' &&
      fields.length === 2 &&
      fields.includes('kind') &&
      fields.includes('path')
    ) {
      targets.push({ kind: target.kind, path: target.path });
    } else {
      return null;
    }
  }

  try {
    return normalizeBannerPageTargets(targets);
  } catch {
    return null;
  }
}

function normalizePathname(value: string): string {
  const queryIndex = value.indexOf('?');
  const fragmentIndex = value.indexOf('#');
  const end = Math.min(
    queryIndex === -1 ? value.length : queryIndex,
    fragmentIndex === -1 ? value.length : fragmentIndex,
  );
  let pathname = value.slice(0, end) || '/';
  while (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return pathname;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isControlCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
}

function trimOuterSpaces(value: string): string {
  let start = 0;
  let end = value.length;
  while (value[start] === ' ') start += 1;
  while (value[end - 1] === ' ') end -= 1;
  return value.slice(start, end);
}
