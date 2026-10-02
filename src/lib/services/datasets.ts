import * as api from '#lib/api.js';
import { Picsure } from '#lib/paths.js';
import type { DataSet } from '#lib/models/Dataset.js';

interface DatasetRequest {
  queryId: string;
  name: string;
}

export async function createDatasetName(queryId: string, name: string): Promise<DataSet> {
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
  return await api.post(Picsure.NamedDataSet, request);
}
