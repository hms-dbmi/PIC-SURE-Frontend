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
   * `MouseEvent.detail` is the click count: `1` for a real pointer press, and `0` for every
   * activation that was not a pointer - Enter, Space, and the synthesised clicks assistive
   * technology dispatches (VoiceOver AXPress, browse-mode Enter, switch control, voice
   * control). Measured identical in chromium, firefox and webkit.
   *
   * Read off the click rather than intercepted at `keydown`, which is what lets assistive
   * technology through. An AXPress arrives as a click with no key event before it, so a
   * keydown handler never sees it, and the user with the most need for focus to follow the
   * page is the one who would not get it. Reading the click also leaves the browser's own
   * activation timing alone - Space still fires on release, where claiming the keydown moved
   * it earlier and took away the "move focus away to cancel" escape.
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
