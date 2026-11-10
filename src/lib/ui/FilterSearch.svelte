<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    label?: string;
    testId?: string;
    class?: string;
  }

  let {
    value = $bindable(''),
    placeholder = 'Search...',
    label = 'Search',
    testId,
    class: className = '',
  }: Props = $props();
</script>

<label class="relative block w-full {className}">
  <span class="sr-only">{label}</span>
  <i
    class="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs opacity-50"
    aria-hidden="true"
  ></i>
  <input
    type="search"
    class="filter-search-input input w-full"
    {placeholder}
    aria-label={label}
    data-testid={testId}
    bind:value
  />
</label>

<style>
  .filter-search-input[type='search'] {
    padding-left: 2rem;
  }
</style>
