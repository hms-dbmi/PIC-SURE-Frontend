import { untrack } from 'svelte';
import { session } from '#lib/auth/session.svelte.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

interface Entity {
  uuid?: string;
}

/** How one PSAMA entity is fetched and saved. Each call takes and returns domain records. */
export interface ResourceConfig<T extends Entity, Saved = T> {
  /** Names the entity in errors, e.g. `Connection`. */
  name: string;
  list(): Promise<T[]>;
  /** Fetches one record. Without it, `get` looks in the loaded list. */
  get?(uuid: string): Promise<T>;
  add?(item: Saved): Promise<T>;
  /** Resolves the record to keep in the list. */
  update?(item: Saved): Promise<T>;
  /** Deletes by `key(record)` when given, otherwise by uuid. */
  remove?: { key?: (item: T) => string; send(key: string): Promise<unknown> };
  /** The label of each `[label, uuid]` pair in `options`. */
  label?(item: T): string;
}

/**
 * A browser-only cache of one admin entity's list. Loaded once per session: it empties when the
 * session ends, so the next admin to sign in in this tab doesn't see the last one's lists.
 */
export class Resource<T extends Entity, Saved = T> {
  #config: ResourceConfig<T, Saved>;
  #items = $state.raw<T[]>([]);
  #loaded = false;

  constructor(config: ResourceConfig<T, Saved>) {
    this.#config = config;
  }

  get items(): readonly T[] {
    return this.#items;
  }

  /** `[label, uuid]` pairs for checkbox and select lists. */
  get options(): [string, string][] {
    const label = this.#config.label ?? (() => '');
    return this.#items.map((item) => [label(item), item.uuid || '']);
  }

  #set(items: T[]) {
    assertNoSsrWrite(`admin ${this.#config.name} list`);
    this.#items = items;
  }

  async load() {
    if (this.#loaded) return;
    this.#set(await this.#config.list());
    this.#loaded = true;
  }

  /** The loaded record, without fetching. */
  find(uuid: string): T | undefined {
    return this.#items.find((item) => item.uuid === uuid);
  }

  // Untracked, so an {#await} or effect that calls it doesn't re-run when the list changes.
  async get(uuid: string): Promise<T> {
    const found = untrack(() => this.find(uuid));
    if (found) return found;
    if (this.#config.get) return this.#config.get(uuid);

    await this.load();
    const loaded = this.find(uuid);
    if (loaded) return loaded;
    throw new Error(`${this.#config.name} not found.`);
  }

  async add(item: Saved) {
    const added = await this.#require('add')(item);
    this.#set([...this.#items, added]);
  }

  /** Replaces the record with the same uuid, or appends one the list doesn't have. */
  async update(item: Saved) {
    const updated = await this.#require('update')(item);
    const index = this.#items.findIndex((i) => i.uuid === updated.uuid);
    this.#set(index === -1 ? [...this.#items, updated] : this.#items.with(index, updated));
  }

  async remove(uuid: string) {
    const remove = this.#require('remove');
    await remove.send(remove.key ? remove.key(await this.get(uuid)) : uuid);
    this.#set(this.#items.filter((item) => item.uuid !== uuid));
  }

  reset() {
    this.#items = [];
    this.#loaded = false;
  }

  #require<K extends 'add' | 'update' | 'remove'>(op: K): NonNullable<ResourceConfig<T, Saved>[K]> {
    const fn = this.#config[op];
    if (!fn) throw new Error(`${this.#config.name} does not support ${op}.`);
    return fn;
  }
}

export function createResource<T extends Entity, Saved = T>(config: ResourceConfig<T, Saved>) {
  const resource = new Resource(config);
  session.onEnd(() => resource.reset());
  return resource;
}
