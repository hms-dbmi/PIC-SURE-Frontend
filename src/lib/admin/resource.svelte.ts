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
class Resource<T extends Entity, Saved = T> {
  #config: ResourceConfig<T, Saved>;
  #items = $state.raw<T[]>([]);
  #loaded = false;
  // Bumped by reset, so a response requested before the session ended doesn't refill the list.
  #generation = 0;

  constructor(config: ResourceConfig<T, Saved>) {
    this.#config = config;
  }

  get items(): readonly T[] {
    return this.#items;
  }

  /** `[label, uuid]` pairs for checkbox and select lists. */
  get options(): [string, string][] {
    const { label, name } = this.#config;
    if (!label) throw new Error(`${name} has no options.`);
    return this.#items.map((item) => [label(item), item.uuid || '']);
  }

  /** Writes the list unless the session ended since `generation` was read. */
  #set(generation: number, items: (current: T[]) => T[]) {
    if (generation !== this.#generation) return false;
    assertNoSsrWrite(`admin ${this.#config.name} list`);
    this.#items = items(this.#items);
    return true;
  }

  async load() {
    if (this.#loaded) return;
    const generation = this.#generation;
    const items = await this.#config.list();
    if (this.#set(generation, () => items)) this.#loaded = true;
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
    const generation = this.#generation;
    const added = await this.#require('add')(item);
    this.#set(generation, (items) => [...items, added]);
  }

  /** Replaces the record with the same uuid, or appends one the list doesn't have. */
  async update(item: Saved) {
    const generation = this.#generation;
    const updated = await this.#require('update')(item);
    this.#set(generation, (items) => {
      const index = items.findIndex((i) => i.uuid === updated.uuid);
      return index === -1 ? [...items, updated] : items.with(index, updated);
    });
  }

  async remove(uuid: string) {
    const generation = this.#generation;
    const remove = this.#require('remove');
    await remove.send(remove.key ? remove.key(await this.get(uuid)) : uuid);
    this.#set(generation, (items) => items.filter((item) => item.uuid !== uuid));
  }

  reset() {
    this.#generation++;
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
