import { describe, expect, it } from 'vitest';
import { Picsure } from '$lib/paths';

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
