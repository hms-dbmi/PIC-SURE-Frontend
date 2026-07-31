import type { QueryInterfaceV2, QueryInterfaceV3 } from '$lib/models/query/Query';

export enum UploadStatus {
  Uploading = 'Uploading',
  Querying = 'Querying',
  Uploaded = 'Uploaded',
  Error = 'Error',
  Unsent = 'Unsent',
  Unknown = 'Unknown',
  Queued = 'Queued',
}

export type Status = {
  genomic: UploadStatus;
  phenotypic: UploadStatus;
  patient: UploadStatus;
  query: UploadStatus;
  queryId: string;
  approved: string | null;
  site: string;
} | null;

export type Sites = {
  sites: string[];
  homeSite: string;
  homeDisplay: string;
} | null;

/**
 * `GET /hpds/{backend}/v3/query/{id}/metadata` — a QueryStatusResponse whose
 * `resultMetadata.queryJson` IS the bare stored query. The server unwraps the
 * legacy `{ query: ... }` envelope and strips `resourceUUID` /
 * `resourceCredentials` before emitting it, whatever the age of the row, so
 * there is no nested `query` member to dig through and no `resourceID`.
 */
export type Metadata = {
  status: string;
  resourceStatus: string | null;
  picsureId: string;
  resourceResultId: string;
  resultMetadata: {
    queryJson: QueryInterfaceV2 | QueryInterfaceV3;
    queryResultMetadata?: string;
  };
} | null;

export type DataType = {
  genomic: boolean;
  phenotypic: boolean;
  patient: boolean;
};
