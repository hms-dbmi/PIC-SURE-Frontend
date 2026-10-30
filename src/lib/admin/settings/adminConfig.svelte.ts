import { session } from '#lib/auth/session.svelte.ts';
import { CONFIG_API_KIND, type ConfigKind, type ConfigObject } from '#lib/config/resolve.ts';
import * as api from '#lib/api/picsure/configuration.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

export type AdminConfigKind = ConfigKind;

export function isApiAvailable(kind: AdminConfigKind): boolean {
  return !!CONFIG_API_KIND[kind];
}

const empty = (): Record<AdminConfigKind, ConfigObject[]> => ({
  features: [],
  settings: [],
  branding: [],
});

/** The admin page's copy of the config rows stored in PIC-SURE, per kind. Browser-only. */
class AdminConfig {
  #rows = $state.raw(empty());
  #loaded = new Set<AdminConfigKind>();
  // Bumped by reset, so a response requested before the session ended doesn't refill the rows.
  #generation = 0;

  rows(kind: AdminConfigKind): readonly ConfigObject[] {
    return this.#rows[kind];
  }

  /** Writes a kind's rows unless the session ended since `generation` was read. */
  #set(
    generation: number,
    kind: AdminConfigKind,
    rows: (current: ConfigObject[]) => ConfigObject[],
  ) {
    if (generation !== this.#generation) return false;
    assertNoSsrWrite('admin config rows');
    this.#rows = { ...this.#rows, [kind]: rows(this.#rows[kind]) };
    return true;
  }

  async load(kind: AdminConfigKind, force = false): Promise<void> {
    if (!force && this.#loaded.has(kind)) return;

    // Without the API a kind has no rows. Nothing is written then: the page calls this from
    // an {#await}, where a synchronous state write is unsafe.
    if (isApiAvailable(kind)) {
      const generation = this.#generation;
      const rows = await api.getConfigRows(CONFIG_API_KIND[kind]);
      if (!this.#set(generation, kind, () => rows)) return;
    }
    this.#loaded.add(kind);
  }

  async add(
    kind: AdminConfigKind,
    name: string,
    value: string,
    description?: string,
  ): Promise<ConfigObject> {
    const generation = this.#generation;
    const created = await api.createConfigRow({
      name,
      kind: CONFIG_API_KIND[kind],
      value,
      description,
    });
    this.#set(generation, kind, (rows) => [...rows.filter((row) => row.name !== name), created]);
    return created;
  }

  async update(kind: AdminConfigKind, row: ConfigObject): Promise<ConfigObject> {
    const { uuid } = row;
    if (!uuid) throw new Error(`Config row ${row.name} has not been saved yet`);
    const generation = this.#generation;
    const updated = await api.updateConfigRow({ ...row, uuid });
    this.#set(generation, kind, (rows) => rows.map((r) => (r.uuid === updated.uuid ? updated : r)));
    return updated;
  }

  async remove(kind: AdminConfigKind, uuid: string): Promise<void> {
    const generation = this.#generation;
    await api.deleteConfigRow(uuid);
    this.#set(generation, kind, (rows) => rows.filter((r) => r.uuid !== uuid));
  }

  reset() {
    this.#generation++;
    this.#rows = empty();
    this.#loaded.clear();
  }

  // Forces the server-side config cache (used to build the app's own runtime config for
  // every session, see config/server/cache.ts) to refetch immediately, instead of waiting for its
  // routine up-to-4-hour expiry. Distinct from load's `force`, which only re-reads this admin
  // UI's own view of the rows.
  invalidateServerCache(): Promise<void> {
    return api.refreshServerConfigCache();
  }
}

export const adminConfig = new AdminConfig();
session.onEnd(() => adminConfig.reset());
