import type { Indexable } from '$lib/types';
import type { QueryInterfaceV3 } from '$lib/models/query/Query';
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
  queryRequest: QueryInterfaceV3;
  exportType: ExportType;
  count: Promise<number>;
  data?: Promise<VariantData>;
}
