import { get, writable, type Writable } from 'svelte/store';

import { settings } from '$lib/configuration';

import type { Indexable } from '$lib/types';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { ExportType } from '$lib/models/Variant';
import type { Column } from '$lib/components/datatable/types';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';

export const count: Writable<number> = writable(0);
export const columns: Writable<Column[]> = writable([]);
export const data: Writable<Indexable[]> = writable([]);
export const downloadUrl: Writable<string> = writable('');
export const dataExportType: Writable<ExportType> = writable(ExportType.Aggregate);
export const variantError: Writable<string> = writable('');

export async function getVariantCount(request: QueryRequestInterface) {
  request.query.expectedResultType = 'VARIANT_COUNT_FOR_QUERY';
  const response = await api
    .post(Picsure.QuerySync, request)
    .then((resp) => resp.count)
    .catch((error) => {
      console.error(error);
      variantError.set(
        'An error occured while retrieving variant count data. Please contact your PIC-SURE admin.',
      );
      return 0;
    });

  count.set(response);
}

export async function getVariantData(request: QueryRequestInterface) {
  request.query.expectedResultType =
    get(dataExportType) === ExportType.Aggregate ? 'AGGREGATE_VCF_EXCERPT' : 'VCF_EXCERPT';
  const response = await api.post(Picsure.QuerySync, request).catch((error) => {
    console.error(error);
    variantError.set(
      'An error occured while retrieving variant data. Please contact your PIC-SURE admin.',
    );
    return '';
  });

  if (!response) return;

  downloadUrl.set(URL.createObjectURL(new Blob([response], { type: 'octet/stream' })));

  const lines = response.split('\n');

  const headers: string[] = lines[0].split('\t');
  const variants: string[][] = lines
    .slice(1)
    .map((line: string) => line.split('\t'))
    .filter((varList: string[]) => varList.length > 1);

  const excludeIndexes = settings.variantExplorer.excludeColumns
    .map((column: string) => headers.indexOf(column))
    .filter((x: number) => x >= 0);

  data.set(
    variants.map((variant: string[]): Indexable => {
      return variant.reduce((map, column, index) => {
        if (excludeIndexes.includes(index)) {
          return map;
        }
        map[headers[index].toString()] = column;
        return map;
      }, {} as Indexable);
    }),
  );

  columns.set(
    headers
      .filter((_header, index) => !excludeIndexes.includes(index))
      .map((header: string): Column => ({ dataElement: header, label: header, sort: true })),
  );
}

export default {
  count,
  columns,
  data,
  downloadUrl,
  dataExportType,
  variantError,
  getVariantCount,
  getVariantData,
};
