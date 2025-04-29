<script lang="ts">
  import { TableHandler } from '@vincjo/datatables/server';

  let { handler }: { handler: TableHandler } = $props();

  const setPage = (value: 'previous' | 'next' | 'last' | number) => {
    handler.setPage(value);
    handler.invalidate();
  };
</script>

<section class="-custom h-10 hidden lg:block">
  {#if handler.pagesWithEllipsis !== undefined}
    <button type="button" disabled={handler.currentPage === 1} onclick={() => setPage('previous')}>
      ←
    </button>
    {#each handler.pagesWithEllipsis as page}
      <button
        type="button"
        class:active={handler.currentPage === page}
        class:ellipse={page === null}
        onclick={() => setPage(page)}
      >
        {page ?? '...'}
      </button>
    {/each}
    <button
      type="button"
      disabled={handler.currentPage === handler.pages.length}
      onclick={() => setPage('next')}
    >
      →
    </button>
  {/if}
</section>
