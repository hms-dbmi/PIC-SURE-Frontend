import { writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Psama } from '$lib/paths';
import type {
  ApiKeyMetadata,
  ApiKeyPage,
  MintedPlatformKey,
  PlatformKeyRequest,
} from '$lib/models/ApiKey';

// Bumped after every mutation so paginated views know to refetch their current page.
export const listVersion: Writable<number> = writable(0);

export function refreshApiKeys() {
  listVersion.update((version) => version + 1);
}

export async function loadApiKeys(page = 0, size = 100): Promise<ApiKeyPage> {
  return api.get(`${Psama.ApiKey.Admin}?page=${page}&size=${size}`);
}

export async function revokeApiKey(uuid: string): Promise<ApiKeyMetadata> {
  const revoked: ApiKeyMetadata = await api.put(`${Psama.ApiKey.Admin}/${uuid}/revoke`, undefined);
  refreshApiKeys();
  return revoked;
}

export async function mintPlatformKey(request: PlatformKeyRequest): Promise<MintedPlatformKey> {
  const minted: MintedPlatformKey = await api.post(Psama.ApiKey.Platform, request);
  refreshApiKeys();
  return minted;
}

export default {
  listVersion,
  refreshApiKeys,
  loadApiKeys,
  revokeApiKey,
  mintPlatformKey,
};
