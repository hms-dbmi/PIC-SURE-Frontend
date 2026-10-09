import { describe, expect, it } from 'vitest';
import { Picsure, appPath } from '#lib/paths.ts';

describe('visualization paths', () => {
  it('names the authorized backend', () => {
    expect(Picsure.Visualization.Distributions).toBe('picsure/visualization/auth/distributions');
  });

  it('names the open backend', () => {
    expect(Picsure.Visualization.DistributionsOpen).toBe(
      'picsure/visualization/open/distributions',
    );
  });
});

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
