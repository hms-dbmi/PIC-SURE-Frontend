import type { Export } from "./Export";
import type { Filter } from "./Filter";

export interface ExportRowInterface {
  ref?: Export | Filter;
  selected?: boolean;
  variableId?: string;
  variableName?: string;
  description?: string;
  type?: 'Categorical' | 'Continuous';
}