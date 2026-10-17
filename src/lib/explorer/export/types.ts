import type { SearchResult } from '#lib/explorer/types.ts';

export interface ExportInterface {
  id: string;
  searchResult: SearchResult;
  display: string;
  conceptPath: string;
  studyId?: string;
}
