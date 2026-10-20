import type { TableEvents } from '#lib/ui/datatable/types.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';

export const tableEvents: TableEvents = {
  pageChange: (page) => log(createLog('ACTION', 'search_result.page_change', { pageNumber: page })),
  pageSizeChange: (size) =>
    log(createLog('ACTION', 'search_result.page_size_change', { pageSize: size })),
};
