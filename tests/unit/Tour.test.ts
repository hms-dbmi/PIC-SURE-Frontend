import { describe, it, expect } from 'vitest';
import TourData from '#lib/assets/TourConfiguration.json';
import { resolveTour } from '#lib/utilities/Tour.ts';

describe('resolveTour', () => {
  it('uses a configured tour that exists', () => {
    expect(resolveTour('BDC-Auth', 'NHANES-Auth')).toBe(TourData['BDC-Auth']);
  });

  it('falls back to the default for an unknown tour name', () => {
    expect(resolveTour('not-a-real-tour', 'NHANES-Auth')).toBe(TourData['NHANES-Auth']);
    expect(resolveTour('constructor', 'NHANES-Auth')).toBe(TourData['NHANES-Auth']);
  });

  it('falls back to the default when no tour is configured', () => {
    expect(resolveTour(undefined, 'BDC-Open')).toBe(TourData['BDC-Open']);
  });
});
