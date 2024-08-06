import type { Indexable } from '$lib/types';

// TODO: Replace metadata nad query types
/* eslint-disable @typescript-eslint/no-explicit-any */
export type DataSet = Indexable & {
  uuid: string;
  user: string;
  name: string;
  archived: boolean;
  metadata: any;
  query: any;
  queryId: string;
  federated?: any;
  startTime: string;
  rawStartTime: number;
};

export interface DatasetError {
  message: Message;
}

interface Message {
  errorType: string;
  message: string;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function secondsToDate(seconds: number) {
  const dt = new Date(seconds);
  const year = dt.toLocaleString('default', { year: 'numeric' });
  const month = dt.toLocaleString('default', { month: '2-digit' });
  const day = dt.toLocaleString('default', { day: '2-digit' });
  return year + '-' + month + '-' + day;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDataset(data: any) {
  let query, federated;
  try {
    const jsonQuery = JSON.parse(data.query.query);
    query = jsonQuery?.query;
    if (jsonQuery?.commonAreaUUID) {
      federated = {
        commonId: jsonQuery?.commonAreaUUID,
      };
    }
  } catch (_) {
    query = {};
  }
  const dataset: DataSet = {
    uuid: data.uuid,
    user: data.user,
    name: data.name,
    archived: data.archived,
    metadata: data.metadata,
    query,
    federated,
    queryId: data.query.uuid,
    startTime: secondsToDate(data.query.startTime),
    rawStartTime: data.query.startTime,
  };
  return dataset;
}
