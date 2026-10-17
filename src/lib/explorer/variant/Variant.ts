import type { Indexable } from '#lib/config/types.ts';
import type { QueryRequestInterfaceV3 } from '#lib/api/picsure/query.types.ts';
import type { Column } from '#lib/ui/datatable/types.ts';

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
