import type { Indexable } from '$lib/types';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import type { Column } from '$lib/components/datatable/types';

export enum ExportType {
  Full = 'full',
  Aggregate = 'aggregate',
}

export interface VariantData {
  columns: Column[];
  rows: Indexable[];
  downloadUrl: string;
}

export interface VariantResult {
  name: string;
  queryRequest: QueryRequestInterfaceV3;
  exportType: ExportType;
  count: Promise<number>;
  data?: Promise<VariantData>;
}
