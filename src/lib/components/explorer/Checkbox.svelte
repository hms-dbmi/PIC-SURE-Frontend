<script lang="ts">
  import type { Indexable } from '$lib/types';
  import { TagCheckbox } from '$lib/models/Search';
  import SearchStore from '$lib/stores/Search';
  const { updateTag } = SearchStore;

  const icons: Indexable = {
    [TagCheckbox.Include]: {
      inactive: 'fa-regular fa-lg fa-square-plus text-primary-700',
      active: 'fa-solid fa-lg fa-square-plus text-sky-600',
    },
    [TagCheckbox.Exclude]: {
      inactive: 'fa-regular fa-lg fa-square-minus text-primary-700',
      active: 'fa-solid fa-lg fa-square-minus text-red-600',
    },
  };

  export let type = '';
  export let tag = '';
  export let state: TagCheckbox = TagCheckbox.Default;
  const normalize = (n: string) => n.replaceAll(' ', '_').toLowerCase();
  const elementId = `${normalize(type)}-${normalize(tag)}`;

  function newTagState(stateToggle: TagCheckbox) {
    const newState = state == stateToggle ? TagCheckbox.Default : stateToggle;
    updateTag(type, tag, newState);
  }
</script>

<div class="flex">
  <div class="flex-auto pl-2">
    {tag}
  </div>
  <div class="filter-group flex-none">
    {#each [TagCheckbox.Include, TagCheckbox.Exclude] as boxType}
      <span
        role="checkbox"
        tabindex="0"
        id={`tag-${elementId}-${boxType}`}
        title={`${boxType} ${tag} tag in search`}
        aria-checked={state == boxType}
        on:click={() => newTagState(boxType)}
        on:keydown={(e) => e.key === ' ' && newTagState(boxType)}
        ><i class={icons[boxType][state == boxType ? 'active' : 'inactive']}></i></span
      >
      <label for={`tag-${elementId}-${boxType}`} class="sr-only">
        <span>{boxType}</span>
      </label>
    {/each}
  </div>
</div>
