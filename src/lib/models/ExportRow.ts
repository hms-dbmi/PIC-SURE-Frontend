import type { ExportInterface } from '#lib/models/Export.ts';
import type { Filter } from '#lib/models/Filter.svelte.ts';

export type ExportType = 'Categorical' | 'Continuous' | 'AnyRecordOf';
export interface ExportRowInterface {
  ref?: ExportInterface | Filter;
  selected?: boolean;
  variableId?: string;
  name?: string;
  description?: string | null;
  type?: ExportType;
}
