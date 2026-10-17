import { countVariants, getVariantExcerpt } from '#lib/api/picsure/query.ts';
import { config } from '#lib/config/config.svelte.ts';
import type { Indexable } from '#lib/utils/objects.ts';

import type { QueryRequestInterfaceV3 } from '#lib/api/picsure/query.types.ts';
import { ExportType } from '#lib/config/index.ts';
import type { VariantData } from '#lib/explorer/variant/Variant.ts';

import type { Column } from '#lib/ui/datatable/types.ts';

export function getVariantCount(request: QueryRequestInterfaceV3): Promise<number> {
  request.query.expectedResultType = 'VARIANT_COUNT_FOR_QUERY';
  return countVariants(request);
}

export function getVariantData(
  exportType: ExportType,
  request: QueryRequestInterfaceV3,
): Promise<VariantData> {
  request.query.expectedResultType =
    exportType === ExportType.Aggregate ? 'AGGREGATE_VCF_EXCERPT' : 'VCF_EXCERPT';

  return getVariantExcerpt(request).then((response) => {
    const downloadUrl = URL.createObjectURL(new Blob([response], { type: 'octet/stream' }));

    const lines = response.split('\n');
    const headers: string[] = lines[0].split('\t');
    const excludeIndexes = config.settings.variantExplorer.excludeColumns
      .map((column: string) => headers.indexOf(column))
      .filter((x: number) => x >= 0);
    const variants: string[][] = lines
      .slice(1)
      .map((line: string) => line.split('\t'))
      .filter((varList: string[]) => varList.length > 1);

    const rows = variants.map((variant: string[]): Indexable => {
      return variant.reduce((map, column, index) => {
        if (!excludeIndexes.includes(index)) {
          map[headers[index].toString()] = column;
        }
        return map;
      }, {} as Indexable);
    });

    const columns = headers
      .filter((_header, index) => !excludeIndexes.includes(index))
      .map(
        (header: string): Column => ({
          dataElement: header,
          label: header,
          sort: true,
          filter: true,
        }),
      );

    return { columns, rows, downloadUrl };
  });
}
