import type { SearchResult } from '#lib/models/Search.js';

export interface ExportInterface {
  id: string;
  searchResult: SearchResult;
  display: string;
  conceptPath: string;
  studyId?: string;
}
