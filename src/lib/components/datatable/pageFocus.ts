export type PendingPageFocus = { page: number; rowsAtRequest: unknown };

/**
 * Whether a focus request made at a page change can be honoured yet. The server handler
 * moves `currentPage` synchronously but replaces `rows` only when its fetch resolves, with a
 * loading placeholder in between, so the request waits on the rows identity changing. A page
 * that no longer matches by then means the data moved for another reason - a new search, a
 * facet - and the request is stale.
 *
 * Callers hold the pending request outside `$state`: nothing renders from it, and a reactive
 * one would re-run the effect that clears it.
 */
export function pendingPageFocusStatus(
  pending: PendingPageFocus,
  handler: { rows: unknown; currentPage: number },
  isLoading: boolean,
  targets: number,
): 'waiting' | 'stale' | 'ready' {
  if (handler.rows === pending.rowsAtRequest) return 'waiting';
  if (handler.currentPage !== pending.page) return 'stale';
  if (targets === 0) return isLoading ? 'waiting' : 'stale';
  return 'ready';
}
