import type { ExportInterface } from '$lib/models/Export';
import type { Filter } from '$lib/models/Filter';

export type ExportType = 'Categorical' | 'Continuous';
export interface ExportRowInterface {
  ref?: ExportInterface | Filter;
  selected?: boolean;
  variableId?: string;
  variableName?: string;
  description?: string;
  type?: ExportType;
}
