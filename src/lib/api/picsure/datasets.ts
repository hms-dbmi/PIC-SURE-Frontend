import { request } from '#lib/api/client.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';
import { mapDataset, type DataSet } from '#lib/datasets/dataset.ts';

interface DatasetRequest {
  queryId: string;
  name: string;
}

export interface DatasetUpdate extends DatasetRequest {
  metadata: DataSet['metadata'];
  archived: boolean;
}

export async function getDatasets(): Promise<DataSet[]> {
  const records = await request<unknown>(Picsure.NamedDataSet, { auth: 'open' });
  if (!Array.isArray(records)) throw new Error('Invalid dataset list response');
  return records.map(mapDataset);
}

export async function getDataset(uuid: string): Promise<DataSet> {
  return mapDataset(await request<unknown>(PicsurePaths.namedDataSet(uuid), { auth: 'open' }));
}

export async function updateDataset(uuid: string, update: DatasetUpdate): Promise<DataSet> {
  return mapDataset(
    await request<unknown>(PicsurePaths.namedDataSet(uuid), {
      method: 'PUT',
      body: update,
      auth: 'open',
    }),
  );
}

export async function createDatasetName(queryId: string, name: string): Promise<DataSet> {
  if (name.trim() === '') {
    throw 'Please input a Dataset ID name';
  }
  const validName = /^[\w \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw 'Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : \' "';
  }

  const body: DatasetRequest = {
    queryId,
    name,
  };
  return await request(Picsure.NamedDataSet, { method: 'POST', body, auth: 'open' });
}
