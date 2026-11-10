export interface TourStepType {
  element: string;
  dependsOnFeature?: string;
  onHighlightStarted?: string;
  removeHighlightClass?: string;
  popover: {
    title: string;
    description: string;
    onPrevClick?: string;
    onNextClick?: string;
  };
}

export interface TourDataType {
  searchTerm: string;
  title: string;
  description: string;
  steps: TourStepType[];
}
