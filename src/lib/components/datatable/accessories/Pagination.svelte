<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';

  let { handler }: { handler: TableHandler | RemoteTableHandler } = $props();

  const setPage = (value: 'previous' | 'next' | 'last' | number) => {
    handler.setPage(value);
    if (handler instanceof RemoteTableHandler) {
      handler.invalidate();
    }
  };
</script>

<section class="pagination flex gap-0" aria-label="pagination">
  {#if handler.pagesWithEllipsis !== undefined || handler.pages !== undefined}
    <button
      type="button"
      aria-label="Previous"
      title="Previous"
      disabled={handler.currentPage === 1}
      onclick={() => setPage('previous')}
    >
      <i class="fa-solid fa-arrow-left"></i>
    </button>
    {#each handler.pagesWithEllipsis as page}
      <button
        type="button"
        aria-label={page ? 'Page ' + page : 'Ellipses'}
        title={page ? 'Page ' + page : 'Ellipses'}
        disabled={page === null}
        aria-current={handler.currentPage === page ? 'page' : false}
        class:active={handler.currentPage === page}
        onclick={page ? () => setPage(page) : () => {}}
      >
        {page ?? '...'}
      </button>
    {/each}
    <button
      type="button"
      aria-label="Next"
      title="Next"
      disabled={handler.currentPage === handler.pages.length}
      onclick={() => setPage('next')}
    >
      <i class="fa-solid fa-arrow-right"></i>
    </button>
  {/if}
</section>
