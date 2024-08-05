import type { SearchResult } from '$lib/models/Search';

export interface ExportInterface {
  id: string;
  searchResult: SearchResult;
  display: string;
  conceptPath: string;
  studyId?: string;
}
