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
  queryId: string;
  approved: string;
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
      query: object;
    };
  };
} | null;

export type DataType = {
  genomic: boolean;
  phenotypic: boolean;
};
