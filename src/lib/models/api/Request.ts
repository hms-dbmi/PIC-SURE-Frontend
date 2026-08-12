import type { QueryV3 } from '$lib/models/query/Query';

/**
 * The legacy query envelope.
 *
 * PIC-SURE's query endpoints no longer accept it. `/hpds/{backend}/v3/query`,
 * `/query/sync` and `/visualization/distributions` all bind the BARE v3
 * `Query` and deserialize STRICTLY, so `query`, `resourceUUID`,
 * `resourceCredentials`, `@type` and the federation fields are unknown members
 * and produce a 400.
 *
 * NO ENDPOINT ACCEPTS THIS ANY MORE. Federated queries were REMOVED
 * server-side: `HpdsQueryV3Controller` dropped `?isInstitute` along with its
 * 410 guard, and the `FederatedQueryRequest` subtype went with the envelope.
 * The only remaining producer is `FederatedQueryService`'s per-site fan-out,
 * which is dead code against this server and is kept solely so removing the
 * federation feature stays a separate, deliberate change.
 *
 * Send the bare `QueryInterfaceV3`. Do not add callers.
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
