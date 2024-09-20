import { resources } from '$lib/configuration';
import * as api from '$lib/api';

export async function loadAllConcepts() {
  const studies = await api.post(`/picsure/search/${resources.openHPDS}`, {
    query: '\\_studies_consents\\',
  });
  console.log('studies', studies);
  const consentPaths = Object.keys(studies?.results?.phenotypes);
  console.log('studyConcepts', consentPaths);
  return consentPaths;
}
