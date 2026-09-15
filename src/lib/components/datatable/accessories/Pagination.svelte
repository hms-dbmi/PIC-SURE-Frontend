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

  const setPage = (value: PageTarget, source: PageChangeSource = 'mouse') => {
    const previousPage = handler.currentPage;
    handler.setPage(value);
    if (handler.currentPage !== previousPage) onPageChange(source);
    log(
      createLog('ACTION', 'search_result.page_change', {
        pageNumber: typeof value === 'number' ? value : handler.currentPage,
      }),
    );
  };

  /**
   * Keyboard activation, taken here rather than left to the click the browser synthesises
   * from it.
   *
   * A button's Enter and Space both arrive at `onclick` looking exactly like a pointer press,
   * so a consumer downstream has no way to tell a keyboard user paging from a mouse user
   * paging - and the two want opposite things from focus. Claiming the keydown gives the two
   * their own entry points, which is the same split `RemoteTable` drew between its arrow-key
   * paging and this component's buttons.
   *
   * `preventDefault` is what makes the split hold: without it the browser fires its own click
   * afterwards and the page changes twice, the second time reported as a mouse press. It also
   * stops Space scrolling the document.
   */
  function onPageKeydown(event: KeyboardEvent, value: PageTarget) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    // A held key must not rapid-fire page changes past where the user can follow.
    if (event.repeat) return;
    setPage(value, 'keyboard');
  }
</script>

<section class="pagination flex gap-0" aria-label="pagination">
  {#if handler.pagesWithEllipsis !== undefined || handler.pages !== undefined}
    <button
      type="button"
      aria-label="Previous"
      title="Previous"
      disabled={handler.currentPage === 1}
      onclick={() => setPage('previous')}
      onkeydown={(event) => onPageKeydown(event, 'previous')}
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
        onkeydown={page ? (event) => onPageKeydown(event, page) : () => {}}
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
      onkeydown={(event) => onPageKeydown(event, 'next')}
    >
      <i class="fa-solid fa-arrow-right"></i>
    </button>
  {/if}
</section>
