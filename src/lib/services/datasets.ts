import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import type { DataSet } from '$lib/models/Dataset';

interface DatasetRequest {
  queryId: string;
  name: string;
  metadata?: { saved: number; siteQueryIds: string[] };
}

export async function createDatasetName(
  queryId: string,
  name: string,
  siteQueryIds?: string[],
): Promise<DataSet> {
  if (name === '' && name.trim() === '') {
    throw 'Please input a Dataset ID name';
  }
  const validName = /^[\w \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw 'Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : \' "';
  }

  const request: DatasetRequest = {
    queryId,
    name,
  };
  if (siteQueryIds) {
    request.metadata = { saved: new Date().valueOf(), siteQueryIds };
  }

  return await api.post(Picsure.NamedDataSet, request);
}
