<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';
  import type { PageChangeSource } from '$lib/components/datatable/types';
  import { log, createLog } from '$lib/logger';

  interface Props {
    handler: TableHandler | RemoteTableHandler;
    onPageChange?: (source: PageChangeSource) => void;
  }

  let { handler, onPageChange = () => {} }: Props = $props();

  type PageTarget = 'previous' | 'next' | 'last' | number;

  /**
   * What kind of activation produced this click.
   *
   * `MouseEvent.detail` is the click count: `1` for a pointer press, `0` for Enter, Space,
   * and the synthesised clicks assistive technology dispatches (VoiceOver AXPress, switch and
   * voice control).
   *
   * Must stay on the click, not `keydown`: an AXPress arrives with no key event before it, so
   * a keydown handler never sees the users this split exists for.
   */
  function sourceOf(event: MouseEvent): PageChangeSource {
    return event.detail === 0 ? 'keyboard' : 'mouse';
  }

  const setPage = (value: PageTarget, source: PageChangeSource) => {
    const previousPage = handler.currentPage;
    handler.setPage(value);
    if (handler.currentPage !== previousPage) onPageChange(source);
    log(
      createLog('ACTION', 'search_result.page_change', {
        pageNumber: typeof value === 'number' ? value : handler.currentPage,
      }),
    );
  };
</script>

<section class="pagination flex gap-0" aria-label="pagination">
  {#if handler.pagesWithEllipsis !== undefined || handler.pages !== undefined}
    <button
      type="button"
      aria-label="Previous"
      title="Previous"
      disabled={handler.currentPage === 1}
      onclick={(event) => setPage('previous', sourceOf(event))}
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
        onclick={page ? (event) => setPage(page, sourceOf(event)) : () => {}}
      >
        {page ?? '...'}
      </button>
    {/each}
    <button
      type="button"
      aria-label="Next"
      title="Next"
      disabled={handler.currentPage === handler.pages.length}
      onclick={(event) => setPage('next', sourceOf(event))}
    >
      <i class="fa-solid fa-arrow-right"></i>
    </button>
  {/if}
</section>
