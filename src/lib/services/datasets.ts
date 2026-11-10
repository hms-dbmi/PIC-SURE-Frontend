import * as api from '#lib/api.ts';
import { Picsure } from '#lib/paths.ts';
import type { DataSet } from '#lib/models/Dataset.ts';

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
