import { createDatasetName } from '#lib/api/picsure/datasets.ts';
import { getQueryStatus } from '#lib/api/picsure/query.ts';
import type { QueryRequest } from '#lib/api/picsure/query.types.ts';
import { config } from '#lib/config/config.svelte.ts';
import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
import {
  DEFAULT_MAX_DATA_POINTS,
  dataPoints,
  exceedsLimit,
  exportVariableCount,
} from '#lib/explorer/export/dataPoints.ts';
import type { ExportInterface } from '#lib/explorer/export/types.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';
import { buildRequest } from '#lib/query/build.ts';
import { resultCountsState } from '#lib/query/counts/resultCounts.svelte.ts';
import { filterState } from '#lib/query/filters.svelte.ts';
import type { ExpectedResultType } from '#lib/query/query.ts';
import { withBackoff } from '#lib/utils/backoff.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';
import { objectUUID } from '#lib/utils/uuid.ts';

export function mapSearchResultAsExport(result: SearchResult): ExportInterface {
  return {
    id: objectUUID(result),
    searchResult: result,
    display: result.display || result.name,
    conceptPath: result.conceptPath,
  };
}

/** The export of a saved dataset failed, or still wasn't ready after the last retry. */
export class ExportStatusError extends Error {
  readonly status: string | undefined;

  constructor(status: string | undefined) {
    super(
      status === 'ERROR'
        ? `Export failed with status: ${status}`
        : `Export not ready. Status: ${status}`,
    );
    this.status = status;
  }
}

/**
 * The variables added for export, and the export stepper's progress: the request it exports,
 * the result type, the dataset it saves and whether its download is ready.
 */
class ExportState {
  #variables: ExportInterface[] = $state.raw([]);
  #request: QueryRequest = $state.raw(buildRequest(null));
  #resultType: ExpectedResultType | undefined = $state();
  #datasetId: string | undefined = $state();
  #datasetName: string | undefined = $state();
  #downloadLocked = $state(true);

  get variables(): readonly ExportInterface[] {
    return this.#variables;
  }

  has(conceptPath: string) {
    return this.#variables.some((variable) => variable.conceptPath === conceptPath);
  }

  add(variable: ExportInterface) {
    if (this.has(variable.conceptPath)) return;
    this.#set([...this.#variables, variable]);
  }

  addAll(variables: ExportInterface[]) {
    this.#set([...this.#variables, ...variables.filter((v) => !this.has(v.conceptPath))]);
  }

  remove(variable: ExportInterface) {
    this.removeAll([variable]);
  }

  removeAll(variables: ExportInterface[]) {
    this.#set(
      this.#variables.filter((v) => !variables.some((r) => r.conceptPath === v.conceptPath)),
    );
  }

  /** Removes the variable with this id, and every variable of the study with this id. */
  removeById(id: string) {
    this.#set(this.#variables.filter((v) => v.id !== id && (!v.studyId || v.studyId !== id)));
  }

  /** Replaces the variables, as when a saved dataset is restored. */
  replace(variables: ExportInterface[]) {
    this.#set(variables);
  }

  clear() {
    this.#set([]);
  }

  // Every change that leaves variables to export opens the results panel that lists them.
  #set(variables: ExportInterface[]) {
    assertNoSsrWrite('exportState');
    this.#variables = variables;
    if (variables.length !== 0) explorerPanel.show();
  }

  get variableCount(): number {
    return exportVariableCount(filterState.phenotypic, this.#variables.length);
  }

  /** Unknown while the participant count is loading, failed or obfuscated. */
  get dataPoints(): number | undefined {
    if (resultCountsState.snapshot.summary.hasError) return undefined;
    return dataPoints(resultCountsState.total, this.variableCount);
  }

  get maxDataPoints(): number {
    return config.settings.maxDataPointsForExport || DEFAULT_MAX_DATA_POINTS;
  }

  get dataLimitExceeded(): boolean {
    return exceedsLimit(this.dataPoints, this.maxDataPoints);
  }

  get request(): QueryRequest {
    return this.#request;
  }

  get resultType() {
    return this.#resultType;
  }

  get datasetId() {
    return this.#datasetId;
  }

  get datasetName() {
    return this.#datasetName;
  }

  get canSave(): boolean {
    return (this.#datasetName?.length ?? 0) > 2 && (this.#datasetId?.length ?? 0) > 0;
  }

  get downloadLocked() {
    return this.#downloadLocked;
  }

  setRequest(request: QueryRequest) {
    assertNoSsrWrite('exportState');
    this.#request = request;
  }

  /** Sets the request's result type to the one chosen, or a data frame. */
  useChosenResultType() {
    assertNoSsrWrite('exportState');
    const expectedResultType = this.#resultType || 'DATAFRAME';
    this.#request = { ...this.#request, query: { ...this.#request.query, expectedResultType } };
  }

  setResultType(type: ExpectedResultType | undefined) {
    assertNoSsrWrite('exportState');
    this.#resultType = type;
  }

  setDatasetId(id: string | undefined) {
    assertNoSsrWrite('exportState');
    this.#datasetId = id;
  }

  setDatasetName(name: string | undefined) {
    assertNoSsrWrite('exportState');
    this.#datasetName = name;
  }

  setDownloadLocked(locked: boolean) {
    assertNoSsrWrite('exportState');
    this.#downloadLocked = locked;
  }

  async saveDataset(): Promise<void> {
    if (!this.#datasetId) throw new Error('No dataset ID provided');
    await createDatasetName(this.#datasetId, this.#datasetName ?? '');
  }

  /**
   * Polls the saved dataset's status until its export can be downloaded, and unlocks the
   * download then. A failed export stops the polling and keeps the download locked.
   */
  async waitForExport(): Promise<void> {
    const id = this.#datasetId;
    if (!id) throw new Error('No dataset ID provided');
    const request = this.#request;
    await withBackoff(
      async () => {
        const { status } = await getQueryStatus(id, request);
        if (status === 'ERROR') {
          this.setDownloadLocked(true);
          throw new ExportStatusError(status);
        }
        if (status !== 'SUCCESS' && status !== 'AVAILABLE') throw new ExportStatusError(status);
        this.setDownloadLocked(false);
      },
      15,
      500,
      60000,
      (error) => !(error instanceof ExportStatusError && error.status === 'ERROR'),
    );
  }

  /** Forgets the stepper's progress; the variables stay. */
  resetStepper() {
    assertNoSsrWrite('exportState');
    this.#resultType = undefined;
    this.#datasetId = undefined;
    this.#datasetName = undefined;
    this.#downloadLocked = true;
    this.#request = buildRequest(null);
  }
}

export const exportState = new ExportState();
