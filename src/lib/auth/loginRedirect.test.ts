import { describe, it, expect } from 'vitest';
import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';

describe('loginRedirectPath', () => {
  it.each([
    ['/', '', '/login?redirectTo=%2F'],
    ['/explorer', '?search=age&page=2', '/login?redirectTo=%2Fexplorer%3Fsearch%3Dage%26page%3D2'],
    ['/admin/users/a b', '?q=%25', '/login?redirectTo=%2Fadmin%2Fusers%2Fa%20b%3Fq%3D%2525'],
  ])('%s%s → %s', (pathname, search, expected) => {
    expect(loginRedirectPath({ pathname, search })).toBe(expected);
  });

  it('ignores the hash and origin of a full URL', () => {
    expect(loginRedirectPath(new URL('https://example.org/dataset/1?x=1#top'))).toBe(
      '/login?redirectTo=%2Fdataset%2F1%3Fx%3D1',
    );
  });
});
