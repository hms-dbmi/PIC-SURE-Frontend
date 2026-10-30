import type { DriveStep, DriverHook } from 'driver.js';
import type { TourDataType, TourStepType } from '#lib/explorer/components/tour/types.ts';

export type TourHooks = Record<string, DriverHook>;

function replacePlaceholders(text: string, searchTerm: string): string {
  return text.replace(/\{\{searchTerm\}\}/g, searchTerm);
}

/**
 * Turns a tour configuration into driver.js steps: drops steps whose feature is off and swaps the
 * hook names in the configuration for the hooks themselves.
 */
export function tourSteps(
  tour: TourDataType,
  enabledFeatures: Record<string, unknown>,
  hooks: TourHooks,
): DriveStep[] {
  return tour.steps
    .filter(({ dependsOnFeature }) => !dependsOnFeature || enabledFeatures[dependsOnFeature])
    .map((step: TourStepType) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { popover, dependsOnFeature, onHighlightStarted, removeHighlightClass, ...rest } = step;
      const { onPrevClick, onNextClick, ...text } = popover;
      return {
        ...rest,
        popover: {
          ...text,
          title: replacePlaceholders(popover.title, tour.searchTerm),
          description: replacePlaceholders(popover.description, tour.searchTerm),
          ...(onPrevClick && { onPrevClick: hooks[onPrevClick] }),
          ...(onNextClick && { onNextClick: hooks[onNextClick] }),
        },
        ...(onHighlightStarted && { onHighlightStarted: hooks[onHighlightStarted] }),
        ...(removeHighlightClass && { removeHighlightClass: hooks[removeHighlightClass] }),
      };
    });
}
