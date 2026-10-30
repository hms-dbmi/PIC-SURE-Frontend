import { request } from '#lib/api/client.ts';
import { Psama } from '#lib/api/paths.ts';
import type {
  ApiKeyMetadata,
  ApiKeyPage,
  ApiKeyType,
  MintedPlatformKey,
  PlatformKeyRequest,
} from '#lib/admin/apiKeys/model.ts';

export interface PublicKeyRequest {
  captchaToken: string | null;
  name: string | null;
  email: string | null;
}

export interface PublicKey {
  apiKey: string;
  uuid: string;
  displayPrefix: string;
  keyType: string;
  expiresAt: string;
}

export function list(page: number, size: number, keyType?: ApiKeyType): Promise<ApiKeyPage> {
  return request<ApiKeyPage>(Psama.ApiKey.Admin, { query: { page, size, keyType } });
}

export function revoke(uuid: string): Promise<ApiKeyMetadata> {
  return request<ApiKeyMetadata>(`${Psama.ApiKey.Admin}/${uuid}/revoke`, { method: 'PUT' });
}

export function mintPlatform(key: PlatformKeyRequest): Promise<MintedPlatformKey> {
  return request<MintedPlatformKey>(Psama.ApiKey.Platform, { method: 'POST', body: key });
}

/** For a visitor who isn't signed in. Never sends a token: a stale one would 401 this endpoint. */
export function requestPublic(key: PublicKeyRequest): Promise<PublicKey> {
  return request<PublicKey>(Psama.Open.ApiKey, { method: 'POST', body: key, auth: 'none' });
}
