import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';

export interface ExportInterface {
  id: string;
  searchResult: SearchResult;
  display: string;
  conceptPath: string;
  studyId?: string;
}
