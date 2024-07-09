import * as api from '$lib/api';
import type { DataSet } from '$lib/models/Dataset';

export async function createDatasetNamee(queryId: string, name: string) {
  if (name === '') {
    return 'Please input a Dataset ID name';
  }
  const validName = /^[\w\d \-\\/?+=\[\]\.():"']+$/g;
  if (!name.match(validName)) {
    return 'Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : &apos; &quot;';
  }

  try {
    const res = await api.post('picsure/dataset/named', { queryId, name });
    console.log(res);
  } catch (e) {
    return e;
  }
}

//TODO make real request and response objects/error handling
