import * as psama from '#lib/api/psama/apiKeys.ts';
import type {
  ApiKeyMetadata,
  ApiKeyPage,
  ApiKeyType,
  MintedPlatformKey,
  PlatformKeyRequest,
} from '#lib/admin/apiKeys/model.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

/** API key admin. The key tables page through PSAMA themselves, so nothing is cached here. */
class ApiKeys {
  #version = $state(0);

  /** Bumped after every mutation so paginated views know to refetch their current page. */
  get version() {
    return this.#version;
  }

  refresh() {
    assertNoSsrWrite('api key list version');
    this.#version++;
  }

  list(page = 0, size = 100, keyType?: ApiKeyType): Promise<ApiKeyPage> {
    return psama.list(page, size, keyType);
  }

  async revoke(uuid: string): Promise<ApiKeyMetadata> {
    const revoked = await psama.revoke(uuid);
    this.refresh();
    return revoked;
  }

  async mintPlatform(request: PlatformKeyRequest): Promise<MintedPlatformKey> {
    const minted = await psama.mintPlatform(request);
    this.refresh();
    return minted;
  }
}

export const apiKeys = new ApiKeys();
