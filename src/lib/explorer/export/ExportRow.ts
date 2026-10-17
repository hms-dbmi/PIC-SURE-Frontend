import type { ExportInterface } from '#lib/explorer/export/types.ts';
import type { Filter } from '#lib/query/filter.svelte.ts';

type ExportType = 'Categorical' | 'Continuous' | 'AnyRecordOf';
export interface ExportRowInterface {
  ref?: ExportInterface | Filter;
  selected?: boolean;
  variableId?: string;
  name?: string;
  description?: string | null;
  type?: ExportType;
}
