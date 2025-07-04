import { get } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { resources } from '$lib/stores/Resources';

export async function loadAllConcepts() {
  const studies = await api.post(`${Picsure.Search}/${get(resources).hpdsOpen}`, {
    query: '\\_studies_consents\\',
  });
  const consentPaths = Object.keys(studies?.results?.phenotypes);
  return consentPaths;
}
