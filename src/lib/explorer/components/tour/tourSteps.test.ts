import { describe, expect, it, vi } from 'vitest';
import type { TourDataType } from '#lib/explorer/components/tour/types.ts';
import { tourSteps } from '#lib/explorer/components/tour/tourSteps.ts';

const tour: TourDataType = {
  searchTerm: 'age',
  title: 'Tour',
  description: 'A tour',
  steps: [
    {
      element: '#explorer-search-box',
      onHighlightStarted: 'clickElement',
      popover: {
        title: 'Search {{searchTerm}}',
        description: 'Try {{searchTerm}}, {{searchTerm}}',
      },
    },
    {
      element: '#explorer-table-row-0',
      dependsOnFeature: 'explorer.enableHierarchy',
      popover: { title: 'Hierarchy', description: '', onNextClick: 'clickElementThenNext' },
    },
  ],
};

const hooks = { clickElement: vi.fn(), clickElementThenNext: vi.fn() };

describe('tourSteps', () => {
  it('fills in the search term and swaps hook names for the hooks', () => {
    const [step] = tourSteps(tour, {}, hooks);
    expect(step).toEqual({
      element: '#explorer-search-box',
      onHighlightStarted: hooks.clickElement,
      popover: { title: 'Search age', description: 'Try age, age' },
    });
  });

  it('keeps a step that depends on a feature only while the feature is on', () => {
    expect(tourSteps(tour, { 'explorer.enableHierarchy': false }, hooks)).toHaveLength(1);

    const steps = tourSteps(tour, { 'explorer.enableHierarchy': true }, hooks);
    expect(steps).toHaveLength(2);
    expect(steps[1]).toEqual({
      element: '#explorer-table-row-0',
      popover: { title: 'Hierarchy', description: '', onNextClick: hooks.clickElementThenNext },
    });
  });
});
