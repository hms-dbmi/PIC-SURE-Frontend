import type { Export } from '$lib/models/Export';
import type { Filter } from '$lib/models/Filter';

export interface ExportRowInterface {
  ref?: Export | Filter;
  selected?: boolean;
  variableId?: string;
  variableName?: string;
  description?: string;
  type?: 'Categorical' | 'Continuous';
}
