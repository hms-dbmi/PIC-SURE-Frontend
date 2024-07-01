import { get, writable, type Writable } from 'svelte/store';

import { type Facet, type SearchResult, TagCheckbox } from '$lib/models/Search';

import type { DictionaryConceptResult, DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
import { searchDictionary, updateFacetsFromSearch } from '$lib/services/dictionary';

// const searchUrl = `picsure/search/${resources.hpds}`;
const searchUrl = 'picsure/proxy/dictionary-api/concepts/';

const facets: Writable<DictionaryFacetResult[]> = writable([]);
const searchTerm: Writable<string> = writable('');
const searchResults: Writable<SearchResult[]> = writable([]);
const selectedFacets: Writable<Facet[]> = writable([]);

const searchResultsMock = {
  totalPages: 1,
  totalElements: 4,
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: {
      unsorted: true,
      sorted: false,
      empty: true,
    },
    offset: 0,
    unpaged: false,
    paged: true,
  },
  numberOfElements: 4,
  first: true,
  last: true,
  size: 10,
  content: [
    {
      conceptPath: '\\NHANES\\examination\\physical fitness\\Stage 1 heart rate (per min)',
      name: 'CVDS1HR',
      display: 'Stage 1 heart rate (per min)',
      dataset: '2',
      description:
        'Heart rate is taken by the automated blood pressure/heart rate monitor and captured directly into the computer system. In the event the heart rate is not captured automatically at the end of stage 1, the technician would manually enter the readings from the heart rate monitor.',
      min: 0,
      max: 0,
      meta: null,
      type: 'Continuous',
    },
    {
      conceptPath: '\\phs000284\\pht001902\\phv00122507\\age\\',
      name: 'phv00122507',
      display: 'age',
      dataset: 'phs000284',
      description: 'Age',
      min: 0,
      max: 0,
      meta: null,
      type: 'Continuous',
    },
    {
      conceptPath: '\\phs002715\\age\\',
      name: 'AGE_CATEGORY',
      display: 'age',
      dataset: 'phs002715',
      description: "Participant's age (category)",
      values: [],
      children: null,
      meta: null,
      type: 'Categorical',
    },
    {
      conceptPath: '\\Variant Data Type\\Low coverage WGS\\',
      name: 'Low coverage WGS',
      display: 'Low coverage WGS',
      dataset: '1',
      description: 'Low coverage WGS',
      values: [],
      children: null,
      meta: null,
      type: 'Categorical',
    },
  ],
  number: 0,
  sort: {
    unsorted: true,
    sorted: false,
    empty: true,
  },
  empty: false,
} as DictionaryConceptResult;

async function search(search: string, page: number = 0, pageSize: number = 10) {
  if (!search) {
    //facets.set([]);
    searchResults.set([]);
    searchTerm.set('');
    return;
  }
  let response: DictionaryConceptResult;
  try {
    response = await searchDictionary(search, { pageNumber: page, pageSize: pageSize });
    //response = await api.post(`${searchUrl}?page=${page}&page_size=${pageSize}`, { facets: [], search });
  } catch (e) {
    console.error(e);
    return; //TODO: error handling
  }
  searchResults.set(response.content);
  console.log(response);
  searchTerm.set(search);
}

async function updateFacets(newFacests: Facet[]) {
  let facetResponse: DictionaryFacetResult[];
  try {
    facetResponse = await updateFacetsFromSearch(get(searchTerm), newFacests);
    console.log(facetResponse);
    facets.set(facetResponse);
  } catch (e) {
    console.error(e);
    return;
  }
}

// TODO: Update include/exclude method to send api update to the server, maybe with a debounce?
function updateTag(type: string, tag: string, newState: TagCheckbox) {
  // const newTags = get(facets);
  // const typeIndex = newTags.findIndex((t) => t.title == type);
  // const tagIndex = newTags[typeIndex].tags.findIndex((t) => t.name == tag);

  // newTags[typeIndex].tags[tagIndex].state = newState;
  //facets.set(newTags);
}

export default {
  subscribe: searchResults.subscribe,
  facets: facets,
  selectedFacets: selectedFacets,
  searchTerm,
  searchResults,
  search,
  updateFacets,
  updateTag,
};
