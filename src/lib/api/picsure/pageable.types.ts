import type { Sort } from '#lib/api/picsure/sort.types.ts';

export interface Pageable {
  offset?: number;
  pageNumber?: number;
  pageSize?: number;
  paged?: boolean;
  sort?: Sort;
  unpaged?: boolean;
}
