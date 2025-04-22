<script lang="ts">
  interface Props {
    placeholder?: string;
    search?: () => void;
    searchTerm?: string;
  }

  let {
    placeholder = 'Search...',
    search = () => {},
    searchTerm = $bindable(''),
  }: Props = $props();
</script>

<div class="flex w-full">
  <input
    type="search"
    autocomplete="off"
    class="search-box w-full"
    id="explorer-search-box"
    data-testid="search-box"
    aria-label="Type search terms here, use enter or the search button to submit search"
    title="Type search terms here, use enter or the search button to submit search"
    {placeholder}
    bind:value={searchTerm}
    onkeydown={(e) => e.key === 'Enter' && search()}
  />
  <button
    id="search-button"
    class="btn variant-filled-primary search-button"
    aria-label="Search"
    title="Search"
    onclick={search}
  >
    <i class="fas fa-search"></i>
  </button>
</div>

<style>
  .search-box {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    margin-right: 0% !important;
  }
  .search-button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding-right: 1rem;
    padding-left: 0.75rem;
  }
</style>
