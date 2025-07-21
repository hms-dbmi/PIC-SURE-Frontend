import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import type { DataSet } from '$lib/models/Dataset';

export async function createDatasetName(queryId: string, name: string): Promise<DataSet> {
  if (name === '' && name.trim() === '') {
    throw 'Please input a Dataset ID name';
  }
  const validName = /^[\w \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw 'Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : \' "';
  }

  return await api.post(Picsure.NamedDataSet, { queryId, name });
}
