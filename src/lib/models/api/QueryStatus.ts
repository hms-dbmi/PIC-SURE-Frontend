/**
 * The status of a single query, as reported by PIC-SURE and by the resource
 * backing it. Returned by `POST /hpds/{backend}/v3/query`,
 * `GET /query/{id}/status` and `GET /query/{id}/metadata`.
 *
 * Renames from the previous wire shape: `picsureResultId` is now `picsureId`,
 * and `resourceID` is gone entirely. `resourceResultId` survives but is the
 * BACKING RESOURCE's id — never use it as the `/query/{id}` path parameter.
 */
export interface QueryStatusResponse {
  /** PIC-SURE-wide id of this query; the `/query/{id}` path parameter. */
  picsureId: string;
  status: QueryStatus;
  /** Raw, free-form status string reported by the backing resource. */
  resourceStatus: string | null;
  /** Result id assigned by the backing resource. Not the PIC-SURE id. */
  resourceResultId: string;
  /** Populated only once the query has succeeded; 0 otherwise. */
  sizeInBytes: number;
  /** Epoch millis at which the query was queued. */
  startTime: number;
  /** Millis from queued to complete; 0 while still running. */
  duration: number;
  /** Epoch millis at which results expire; 0 when the resource reports none. */
  expiration: number;
  /**
   * Open-ended resource metadata; the producing endpoint decides the keys, so
   * consumers must treat every key as optional.
   */
  resultMetadata: Record<string, unknown>;
}

/** The only real status values. `SUCCESS` was never one of them. */
export type QueryStatus = 'QUEUED' | 'PENDING' | 'ERROR' | 'AVAILABLE';

/**
 * A time-limited URL results can be downloaded from. `POST
 * /query/{id}/signed-url` answers this object; it used to pass the bare URL
 * string straight through.
 */
export interface SignedUrlResponse {
  signedUrl: string;
}

/**
 * A single page of results plus its paging metadata — the shape every
 * paginated PIC-SURE endpoint now answers, replacing the Spring `Page`
 * (`content` / `totalElements` / `number` / `totalPages` / `last`).
 *
 * The base of `page` is defined by the SERVING ENDPOINT, not by this type:
 * the dictionary's `/concepts` is ZERO-based, while HPDS's `/search/values`
 * is ONE-based and rejects `page < 1`.
 */
export interface PaginatedResponse<T> {
  results: T[];
  page: number;
  total: number;
}
