import type { QueryV2, QueryV3 } from '$lib/models/query/Query';

export interface QueryRequestInterfaceV2 {
  resourceUUID: string;
  query: QueryV2;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}

/**
 * The legacy query envelope.
 *
 * PIC-SURE's query endpoints no longer accept it. `/hpds/{backend}/v3/query`,
 * `/query/sync` and `/visualization/distributions` all bind the BARE v3
 * `Query` and deserialize STRICTLY, so `query`, `resourceUUID`,
 * `resourceCredentials`, `@type` and the federation fields are unknown members
 * and produce a 400.
 *
 * It survives only for the FEDERATED fan-out (`?isInstitute=true`), which is a
 * separate surface that the contract work has not retyped — see
 * `FederatedQueryService`. Send the bare `QueryInterfaceV3` everywhere else.
 */
export interface FederatedQueryRequestInterface {
  resourceUUID: string;
  query: QueryV3;
  '@type'?: string;
  commonAreaUUID?: string;
  institutionOfOrigin?: string;
  requesterEmail?: string;
  resourceCredentials?: Record<string, string>;
}
