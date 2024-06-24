import { get, writable, type Writable } from 'svelte/store';

import {
  mapTags,
  type SearchTagType,
  mapSearchResults,
  type SearchResult,
  TagCheckbox,
} from '$lib/models/Search';
import * as api from '$lib/api';

import { resources } from '$lib/configuration';

const searchUrl = `picsure/search/${resources.hpds}`;

const tags: Writable<SearchTagType[]> = writable([]);
const searchTerm: Writable<string> = writable('');
const searchResults: Writable<SearchResult[]> = writable([]);

const tagsMock = [
  {
    title: 'Dataset',
    tags: ['NHANES', '1000 Genomes'],
  },
  {
    title: 'Category',
    tags: ['laboratory', 'questionaire'],
  },
  {
    title: 'Data Type',
    tags: ['type 1', 'type 2'],
  },
];

async function search(search: string) {
  if (!search) {
    tags.set([]);
    searchResults.set([]);
    searchTerm.set('');
    return;
  }
  const response = await api.post(searchUrl, { query: search });
  tags.set(tagsMock.map(mapTags));
  searchResults.set(Object.values(response.results.phenotypes).map(mapSearchResults));
  searchTerm.set(search);
}

// TODO: Update include/exclude method to send api update to the server, maybe with a debounce?
function updateTag(type: string, tag: string, newState: TagCheckbox) {
  const newTags = get(tags);
  const typeIndex = newTags.findIndex((t) => t.title == type);
  const tagIndex = newTags[typeIndex].tags.findIndex((t) => t.name == tag);

  newTags[typeIndex].tags[tagIndex].state = newState;
  tags.set(newTags);
}

export default {
  subscribe: tags.subscribe,
  tags,
  searchTerm,
  searchResults,
  search,
  updateTag,
};
