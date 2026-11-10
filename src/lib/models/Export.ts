import type { SearchResult } from '#lib/models/Search.ts';

export interface ExportInterface {
  id: string;
  searchResult: SearchResult;
  display: string;
  conceptPath: string;
  studyId?: string;
}
