<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    /** The accessible name; visually hidden. */
    label?: string;
    /** Wrapper classes; set a width (default `w-full`). */
    class?: string;
    'data-testid'?: string;
    oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
  }

  let {
    value = $bindable(''),
    placeholder = 'Search...',
    label = 'Search',
    class: className = 'w-full',
    'data-testid': testid,
    oninput,
  }: Props = $props();
</script>

<label class="relative block {className}">
  <span class="sr-only">{label}</span>
  <i
    class="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs opacity-50"
    aria-hidden="true"
  ></i>
  <input
    type="search"
    class="search-input input w-full"
    {placeholder}
    data-testid={testid}
    bind:value
    {oninput}
  />
</label>

<style>
  .search-input[type='search'] {
    padding-left: 2rem;
  }
</style>
