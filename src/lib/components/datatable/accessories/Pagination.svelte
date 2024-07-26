<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteHander } from '@vincjo/datatables/remote';
  export let handler: DataHandler | RemoteHander;
  const pageNumber = handler.getPageNumber();
  const pageCount = handler.getPageCount();
  const pages = handler.getPages({ ellipsis: true });
  const setPage = (value: 'previous' | 'next' | number) => {
    handler.setPage(value);
    if (handler instanceof RemoteHander) {
      handler.invalidate();
    }
  };
</script>

<!-- Desktop buttons -->
<section class="btn-group-custom h-10 hidden lg:block">
  {#if $pages !== undefined}
    <button type="button" disabled={$pageNumber === 1} on:click={() => setPage('previous')}>
      ←
    </button>
    {#each $pages as page}
      <button
        type="button"
        class:active={$pageNumber === page}
        class:ellipse={page === null}
        on:click={() => setPage(page)}
      >
        {page ?? '...'}
      </button>
    {/each}
    <button type="button" disabled={$pageNumber === $pageCount} on:click={() => setPage('next')}>
      →
    </button>
  {/if}
</section>
