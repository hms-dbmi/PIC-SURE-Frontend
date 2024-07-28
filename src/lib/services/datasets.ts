import * as api from '$lib/api';
import type { DataSet } from '$lib/models/Dataset';

export async function createDatasetName(queryId: string, name: string): Promise<DataSet> {
  if (name === '') {
    throw 'Please input a Dataset ID name';
  }
  const validName = /^[\w\d \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw 'Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : \' \"';
  }

  return await api.post('picsure/dataset/named', { queryId, name });
}
