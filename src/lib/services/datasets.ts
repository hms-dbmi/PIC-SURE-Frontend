import * as api from '$lib/api';
import type { DataSet } from '$lib/models/Dataset';

export async function createDatasetName(queryId: string, name: string): Promise<DataSet> {
  if (name === '' && name.trim() === '') {
    throw 'Please input a Dataset ID name';
  }

  return await api.post('picsure/dataset/named', { queryId, name });
}
