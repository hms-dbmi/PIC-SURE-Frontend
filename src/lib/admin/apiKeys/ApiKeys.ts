import { writable, type Writable } from 'svelte/store';

import * as apiKeys from '#lib/api/psama/apiKeys.ts';
import type {
  ApiKeyMetadata,
  ApiKeyPage,
  ApiKeyType,
  MintedPlatformKey,
  PlatformKeyRequest,
} from '#lib/admin/apiKeys/model.ts';

// Bumped after every mutation so paginated views know to refetch their current page.
export const listVersion: Writable<number> = writable(0);

export function refreshApiKeys() {
  listVersion.update((version) => version + 1);
}

export async function loadApiKeys(page = 0, size = 100, keyType?: ApiKeyType): Promise<ApiKeyPage> {
  return apiKeys.list(page, size, keyType);
}

export async function revokeApiKey(uuid: string): Promise<ApiKeyMetadata> {
  const revoked = await apiKeys.revoke(uuid);
  refreshApiKeys();
  return revoked;
}

export async function mintPlatformKey(request: PlatformKeyRequest): Promise<MintedPlatformKey> {
  const minted = await apiKeys.mintPlatform(request);
  refreshApiKeys();
  return minted;
}
