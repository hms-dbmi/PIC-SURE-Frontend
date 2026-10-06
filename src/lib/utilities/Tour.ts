import TourData from '#lib/assets/TourConfiguration.json';
import type { TourDataType } from '#lib/models/Tour.ts';

const tours: Record<string, TourDataType> = TourData;

export function resolveTour(
  name: string | undefined,
  fallback: keyof typeof TourData,
): TourDataType {
  return name !== undefined && Object.hasOwn(tours, name) ? tours[name] : tours[fallback];
}
