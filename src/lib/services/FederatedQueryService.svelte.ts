import { get } from 'svelte/store';
import type { FederatedQueryRequestInterface } from '$lib/models/api/Request';
import type { QueryInterfaceV3 } from '$lib/models/query/Query';
import { commonAreaUUID, federatedQueryMap } from '$lib/stores/Dataset.svelte';
import { Picsure } from '$lib/paths';
import * as api from '$lib/api';
import { getQueryResources, loadResources, resources } from '$lib/stores/Resources';
import { QueryV3 } from '$lib/models/query/Query';

// Both replies are QueryStatusResponse: the id is picsureId (picsureResultId
// was renamed and resourceID is gone).
export interface QueryResponse {
  picsureId: string;
}

export interface FederatedResponse {
  picsureId: string;
}

export interface FederatedQueryResult {
  responses: Record<string, string>;
  datasetId: string;
}

async function createCommonAreaUUID(query: FederatedQueryRequestInterface): Promise<string> {
  const currentUUID = get(commonAreaUUID);
  if (currentUUID) {
    return currentUUID;
  }

  const uuidQuery = new QueryV3();
  const uuidQueryRequest: FederatedQueryRequestInterface = {
    query: uuidQuery,
    resourceUUID: get(resources).queryIdGen,
  };

  try {
    const res: FederatedResponse = await api.post(Picsure.QueryV3, uuidQueryRequest);
    const commonAreaDatasetId = res.picsureId;

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

async function executeSiteQueries(
  query: FederatedQueryRequestInterface,
): Promise<Record<string, string>> {
  const responses: Record<string, string> = {};
  const resources = getQueryResources();

  const queryResults = await Promise.allSettled(
    resources.map((resource) => {
      const resourceQuery = structuredClone($state.snapshot(query));
      resourceQuery.resourceUUID = resource.uuid;
      resourceQuery.query.expectedResultType = 'COUNT';

      resourceQuery.resourceCredentials = resourceQuery.resourceCredentials || {};

      return api
        .post(Picsure.QueryV3 + '?isInstitute=true', resourceQuery)
        .then((response: QueryResponse) => {
          if (response.picsureId) {
            return {
              resourceName: resource.name,
              picsureId: response.picsureId,
              success: true,
            };
          } else {
            console.warn(`No picsureId for resource: ${resource.name}`);
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

  let hasAnySuccess = false;
  const errors: string[] = [];

  queryResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      const queryResult = result.value;
      if (queryResult.success && 'picsureId' in queryResult && queryResult.picsureId) {
        responses[queryResult.resourceName] = queryResult.picsureId;
        federatedQueryMap.update((current) => ({
          ...current,
          [queryResult.resourceName]: {
            ...(current[queryResult.resourceName] || {}),
            queryId: queryResult.picsureId,
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

  if (!hasAnySuccess && errors.length > 0) {
    throw new Error(`All federated queries failed: ${errors.join(', ')}`);
  }
  if (errors.length > 0) {
    console.warn('Some federated queries failed:', errors);
  }

  return responses;
}

/**
 * Federated fan-out. Unlike every other query call, this still sends the
 * legacy envelope: `?isInstitute=true` is a separate, not-yet-retyped surface
 * that needs `resourceUUID`, `commonAreaUUID` and `@type` per site. It takes
 * the BARE query and wraps it here, so the envelope never escapes this module.
 */
export async function executeFederatedQuery(
  bareQuery: QueryInterfaceV3,
): Promise<FederatedQueryResult> {
  const query: FederatedQueryRequestInterface = {
    query: bareQuery as FederatedQueryRequestInterface['query'],
    resourceUUID: '',
  };
  await loadResources();

  const allResources = getQueryResources();

  const initialMap: Record<string, { status?: string; resourceId?: string; name?: string }> = {};
  allResources.forEach(({ name, uuid }) => {
    initialMap[name] = { status: 'PENDING', resourceId: uuid, name };
  });
  federatedQueryMap.set(initialMap);

  const datasetId = await createCommonAreaUUID(query);

  query['@type'] = 'FederatedQueryRequest';
  try {
    const responses = await executeSiteQueries(query);
    return { responses, datasetId };
  } catch (error) {
    allResources
      .map((r) => r.name)
      .forEach((resourceName) => {
        federatedQueryMap.update((current) => ({
          ...current,
          [resourceName]: {
            ...(current[resourceName] || {}),
            status: 'ERROR',
          },
        }));
      });
    throw error;
  }
}
