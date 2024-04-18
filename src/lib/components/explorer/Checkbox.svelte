<script lang="ts">
  import { onMount } from 'svelte';
  import type { Indexable } from '$lib/types';
  import { TagCheckbox } from '$lib/models/Search';
  import SearchStore from '$lib/stores/Search';
  import { KeyboardNavigation } from '$lib/utilities/KeyNavigation';

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

  function newTagState(stateToggle: TagCheckbox) {
    const newState = state == stateToggle ? TagCheckbox.Default : stateToggle;
    updateTag(type, tag, newState);
  }

  const normalize = (n: string) => n.replaceAll(' ', '_').toLowerCase();
  const elementId = `${normalize(type)}-${normalize(tag)}`;
  const checkboxStates: TagCheckbox[] = [TagCheckbox.Include, TagCheckbox.Exclude];

  let navigation: KeyboardNavigation;
  let container: HTMLElement;
  const checkboxes: HTMLElement[] = [];

  onMount(() => {
    navigation = new KeyboardNavigation(container, {
      scope: ['+', '-', ' ', 'Enter', 'ArrowLeft', 'ArrowRight'],
      elements: checkboxes,
      getElement: (index: number) => checkboxes[index],
      focusKeys: (index: number) => ({
        ArrowLeft: checkboxes[(index + checkboxes.length - 1) % checkboxes.length],
        ArrowRight: checkboxes[(index + 1) % checkboxes.length],
        '+': checkboxes[0],
        '-': checkboxes[1],
      }),
      charFocusKeys: [],
      actionKeys: (index: number) => ({
        '+': () => checkboxes[0].click(),
        '-': () => checkboxes[1].click(),
        ' ': () => checkboxes[index].click(),
        Enter: () => checkboxes[index].click(),
      }),
    });
  });
</script>

<div
  class="flex checkboxes"
  data-testid={`tag-${elementId}`}
  bind:this={container}
  aria-label={`${tag} ${type}${
    state !== TagCheckbox.Default ? ' is ' + state + 'ed' : ''
  }. Press plus key to include only search results having this tag. Press the minus key to exclude all search results having this tag.`}
>
  <div class="flex-auto pl-2">
    {tag}
  </div>
  <div class="filter-group flex-none">
    {#each checkboxStates as checkbox, index}
      <span
        role="checkbox"
        tabindex={index === 0 ? 0 : -1}
        id={`tag-${elementId}-${checkbox}`}
        aria-checked={state == checkbox}
        bind:this={checkboxes[index]}
        on:click={() => newTagState(checkbox)}
        on:keydown={(e) => navigation.handleKeydown(e, index)}
        ><i class={icons[checkbox][state == checkbox ? 'active' : 'inactive']}></i></span
      >
      <label for={`tag-${elementId}-${checkbox}`} class="sr-only">
        <span>{checkbox}</span>
      </label>
    {/each}
  </div>
</div>

<style>
  .checkboxes {
    border: 2px solid rgb(var(--color-surface-50));
  }
</style>
