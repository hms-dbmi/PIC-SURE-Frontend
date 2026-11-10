import { describe, expect, it } from 'vitest';
import { appPath } from '#lib/api/paths.ts';

describe('appPath', () => {
  it('drops the leading slash kit 3 pathnames do not use', () => {
    expect(appPath('/explorer?search=heart#top')).toBe('explorer?search=heart#top');
  });

  it('maps the root to the empty path', () => {
    expect(appPath('/')).toBe('');
  });

  it('leaves a slash-less path alone', () => {
    expect(appPath('admin/users')).toBe('admin/users');
  });
});
