import { get } from 'svelte/store';
import { type QueryRequestInterface } from '$lib/models/api/Request';
import { commonAreaUUID, federatedQueryMap } from '$lib/stores/Dataset';
import { Picsure } from '$lib/paths';
import * as api from '$lib/api';
import { getQueryResources, loadResources, resources } from '$lib/stores/Resources';
import { Query } from '$lib/models/query/Query';

interface UseFederatedQueryOptions {
  query: QueryRequestInterface;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface FederatedQueryState {
  isLoading: boolean;
  error: string | null;
  statuses: Record<string, string>;
  responses: Record<string, string>;
}

export interface QueryStatusResponse {
  status: string;
  responseText?: string;
}

export interface QueryResponse {
  picsureResultId: string;
}

export interface CommonAreaResponse {
  picsureResultId: string;
}

export class FederatedQueryManager {
  /**
   * Creates a common area UUID for coordinating federated queries
   */
  async createCommonAreaUUID(query: QueryRequestInterface): Promise<string> {
    const currentUUID = get(commonAreaUUID);
    if (currentUUID) {
      return currentUUID;
    }

    const uuidQuery = new Query();
    const uuidQueryRequest: QueryRequestInterface = {
      query: uuidQuery,
      resourceUUID: get(resources).queryIdGen,
    };

    try {
      const res: CommonAreaResponse = await api.post(Picsure.Query, uuidQueryRequest);
      const commonAreaDatasetId = res.picsureResultId;

      if (!commonAreaDatasetId) {
        throw new Error('Failed to generate common area UUID');
      }

      commonAreaUUID.set(commonAreaDatasetId);
      query.commonAreaUUID = commonAreaDatasetId;
      return commonAreaDatasetId;
    } catch (error) {
      throw new Error(
        `Failed to create common area UUID: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Executes a federated query across all institute nodes
   * Handles partial failures gracefully - some sites can fail while others succeed
   */
  async executeFederatedQuery(query: QueryRequestInterface): Promise<Record<string, string>> {
    const responses: Record<string, string> = {};
    const resources = getQueryResources();

    // Execute all queries in parallel, but handle failures individually
    const queryResults = await Promise.allSettled(
      resources.map((resource) => {
        const resourceQuery = structuredClone(query);
        resourceQuery.resourceUUID = resource.uuid;
        resourceQuery.query.expectedResultType = 'COUNT';

        // Set fields expected by FederatedQueryRequest
        resourceQuery.resourceCredentials = resourceQuery.resourceCredentials || {};
        // Note: institutionOfOrigin and requesterEmail are set by the backend

        console.log('Final federated query payload:', JSON.stringify(resourceQuery, null, 2));

        return api
          .post(`${Picsure.Query}`, resourceQuery)
          .then((response: QueryResponse) => {
            if (response.picsureResultId) {
              return {
                resourceName: resource.name,
                picsureResultId: response.picsureResultId,
                success: true,
              };
            } else {
              console.warn(`No picsureResultId for resource: ${resource.name}`);
              return {
                resourceName: resource.name,
                error: 'No result ID returned',
                success: false,
              };
            }
          })
          .catch((error) => {
            console.error(`Failed to query resource ${resource.name}:`, error);
            return {
              resourceName: resource.name,
              error:
                error instanceof Error ? error.message : `API Error: ${error.status || 'Unknown'}`,
              success: false,
            };
          });
      }),
    );

    // Process results and collect successful responses
    let hasAnySuccess = false;
    const errors: string[] = [];

    queryResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const queryResult = result.value;
        if (
          queryResult.success &&
          'picsureResultId' in queryResult &&
          queryResult.picsureResultId
        ) {
          responses[queryResult.resourceName] = queryResult.picsureResultId;
          federatedQueryMap.update((current) => ({
            ...current,
            [queryResult.resourceName]: {
              ...(current[queryResult.resourceName] || {}),
              queryId: queryResult.picsureResultId,
              status: 'COMPLETE',
            },
          }));
          hasAnySuccess = true;
        } else if (!queryResult.success && 'error' in queryResult) {
          errors.push(`${queryResult.resourceName}: ${queryResult.error}`);
          federatedQueryMap.update((current) => ({
            ...current,
            [queryResult.resourceName]: {
              ...(current[queryResult.resourceName] || {}),
              status: 'ERROR',
            },
          }));
        }
      } else {
        errors.push(`Unknown failure: ${result.reason}`);
      }
    });

    // Only throw if ALL queries failed
    if (!hasAnySuccess && errors.length > 0) {
      throw new Error(`All federated queries failed: ${errors.join(', ')}`);
    }

    // Log warnings for partial failures but continue
    if (errors.length > 0) {
      console.warn('Some federated queries failed:', errors);
    }

    return responses;
  }
}

export function useFederatedQuery(options: UseFederatedQueryOptions) {
  const { query, onComplete, onError } = options;

  let state = $state<FederatedQueryState>({
    isLoading: false,
    error: null,
    statuses: {},
    responses: {},
  });

  let datasetId = $state('');
  let saveable = $state(false);

  const manager = new FederatedQueryManager();

  async function initialize() {
    try {
      state.isLoading = true;
      state.error = null;

      // Load resources first
      await loadResources();

      // Get all expected resources so we can track failed ones
      const allResources = getQueryResources();
      const allResourceNames = allResources.map((r) => r.name);

      // Initialize all sites as PENDING immediately so Summary shows loading states
      const initialMap: Record<string, { status?: string; resourceId?: string; name?: string }> =
        {};
      allResources.forEach(({ name, uuid }) => {
        initialMap[name] = { status: 'PENDING', resourceId: uuid, name };
      });
      federatedQueryMap.set(initialMap);

      // Create common area UUID
      const uuid = await manager.createCommonAreaUUID(query);
      datasetId = uuid;

      // Set the type for federated queries - try different type names
      query['@type'] = 'FederatedQueryRequest';

      // Execute federated queries (handles partial failures gracefully)
      try {
        state.isLoading = false;
        const responses = await manager.executeFederatedQuery(query);
        state.responses = responses;
        onComplete?.();
      } catch (queryError) {
        // This only happens if ALL queries failed
        state.error =
          queryError instanceof Error ? queryError.message : 'Failed to execute federated queries';
        state.isLoading = false;

        allResourceNames.forEach((resourceName) => {
          federatedQueryMap.update((current) => ({
            ...current,
            [resourceName]: {
              ...(current[resourceName] || {}),
              status: 'ERROR',
            },
          }));
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      state.error = errorMsg;
      state.isLoading = false;
      onError?.(error instanceof Error ? error : new Error(errorMsg));
    }
  }

  function reset() {
    state = {
      isLoading: false,
      error: null,
      statuses: {},
      responses: {},
    };
    datasetId = '';
    saveable = false;
  }

  return {
    get state() {
      return state;
    },
    get datasetId() {
      return datasetId;
    },
    get saveable() {
      return saveable;
    },

    initialize,
    reset,
    get isReady() {
      return !state.isLoading && (Object.keys(state.responses).length > 0 || saveable);
    },

    get hasErrors() {
      return !!state.error;
    },
  };
}
