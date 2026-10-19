import type { ExportType } from '#lib/config/index.ts';
import type { QueryRequest } from '#lib/api/picsure/query.types.ts';
import type { Column } from '#lib/ui/datatable/types.ts';
import type { Indexable } from '#lib/utils/objects.ts';

export interface VariantData {
  columns: Column[];
  rows: Indexable[];
  downloadUrl: string;
}

export interface VariantResult {
  name: string;
  queryRequest: QueryRequest;
  exportType: ExportType;
  count: Promise<number>;
  data?: Promise<VariantData>;
}
