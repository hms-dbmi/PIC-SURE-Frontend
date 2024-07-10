import type { SearchResult } from '$lib/models/Search';

interface ExportInterface {
  variableName: string;
  variableId: string;
  studyId?: string;
  searchResult: SearchResult;
}

export type Export = ExportInterface;
