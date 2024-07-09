import type { SearchResult } from "./Search";

interface ExportInterface {
  variableName: string;
  variableId: string;
  studyId?: string;
  searchResult?: SearchResult
}

export type Export = ExportInterface;
