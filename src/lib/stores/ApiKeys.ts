import { writable, type Writable } from 'svelte/store';

import * as api from '#lib/api.ts';
import { Psama } from '#lib/paths.ts';
import type {
  ApiKeyMetadata,
  ApiKeyPage,
  ApiKeyType,
  MintedPlatformKey,
  PlatformKeyRequest,
} from '#lib/models/ApiKey.ts';

// Bumped after every mutation so paginated views know to refetch their current page.
export const listVersion: Writable<number> = writable(0);

export function refreshApiKeys() {
  listVersion.update((version) => version + 1);
}

export async function loadApiKeys(page = 0, size = 100, keyType?: ApiKeyType): Promise<ApiKeyPage> {
  const typeParam = keyType ? `&keyType=${keyType}` : '';
  return api.get(`${Psama.ApiKey.Admin}?page=${page}&size=${size}${typeParam}`);
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
