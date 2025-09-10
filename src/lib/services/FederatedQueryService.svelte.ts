import { get } from 'svelte/store';
import { type QueryRequestInterface } from '$lib/models/api/Request';
import { commonAreaUUID, federatedQueryMap } from '$lib/stores/Dataset';
import { Picsure } from '$lib/paths';
import * as api from '$lib/api';
import { getQueryResources, loadResources, resources } from '$lib/stores/Resources';
import { Query } from '$lib/models/query/Query';

export interface QueryResponse {
  picsureResultId: string;
}

export interface CommonAreaResponse {
  picsureResultId: string;
}

export interface FederatedQueryResult {
  responses: Record<string, string>;
  datasetId: string;
}

async function createCommonAreaUUID(query: QueryRequestInterface): Promise<string> {
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

async function executeSiteQueries(query: QueryRequestInterface): Promise<Record<string, string>> {
  const responses: Record<string, string> = {};
  const resources = getQueryResources();

  const queryResults = await Promise.allSettled(
    resources.map((resource) => {
      const resourceQuery = structuredClone($state.snapshot(query));
      resourceQuery.resourceUUID = resource.uuid;
      resourceQuery.query.expectedResultType = 'COUNT';

      resourceQuery.resourceCredentials = resourceQuery.resourceCredentials || {};

      return api
        .post(Picsure.Query, resourceQuery)
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

  let hasAnySuccess = false;
  const errors: string[] = [];

  queryResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      const queryResult = result.value;
      if (queryResult.success && 'picsureResultId' in queryResult && queryResult.picsureResultId) {
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

  if (!hasAnySuccess && errors.length > 0) {
    throw new Error(`All federated queries failed: ${errors.join(', ')}`);
  }
  if (errors.length > 0) {
    console.warn('Some federated queries failed:', errors);
  }

  return responses;
}

export async function executeFederatedQuery(
  query: QueryRequestInterface,
): Promise<FederatedQueryResult> {
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
