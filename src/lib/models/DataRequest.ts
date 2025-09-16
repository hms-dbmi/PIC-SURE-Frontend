import type { QueryInterface } from '$lib/models/query/Query';

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

export type Metadata = {
  status: string;
  resourceID: string;
  resourceStatus: string | null;
  picsureResultId: string;
  resourceResultId: string;
  resultMetadata: {
    queryJson: {
      type: string;
      resourceUUID: string;
      commonAreaUUID: string;
      query: QueryInterface;
      institutionOfOrigin: string;
      requesterEmail: string;
    };
  };
} | null;

export type DataType = {
  genomic: boolean;
  phenotypic: boolean;
  patient: boolean;
};
