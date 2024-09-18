import { resources } from '$lib/configuration';
import * as api from '$lib/api';

export let cachedConsentPaths: string[] = [];
export let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000 * 24; // 24 hours

export async function loadAllConcepts() {
  const now = Date.now();
  if (cachedConsentPaths?.length && now - cacheTimestamp < CACHE_DURATION) {
    return cachedConsentPaths;
  }

  const studies = await api.post(`/picsure/search/${resources.openHPDS}`, {
    query: '\\_studies_consents\\',
  });
  console.log('studies', studies);
  let consentPaths = Object.keys(studies?.results?.phenotypes);
  cachedConsentPaths = consentPaths;
  cacheTimestamp = now;
  console.log('studyConcepts', consentPaths);
  return consentPaths;
}
