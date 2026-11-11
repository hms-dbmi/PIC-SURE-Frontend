<script lang="ts">
  import CopyButton from '#lib/ui/CopyButton.svelte';
  import { createLog, log } from '#lib/telemetry/logger.ts';
  import type { UndoState } from '../chat.svelte.ts';
  import { renderChatMarkdown } from '../model/markdown.ts';
  import type { ChatMessage, ScreenPart } from '../model/types.ts';

  interface Props {
    message: ChatMessage;
    /** True when this user message opens a new exchange, which gets more space above it. */
    startsExchange?: boolean;
    undoState?: UndoState;
    onundo?: () => void;
    onredo?: () => void;
  }

  let {
    message,
    startsExchange = false,
    undoState = 'locked',
    onundo = () => {},
    onredo = () => {},
  }: Props = $props();

  const PART_LABELS: Record<ScreenPart, string> = {
    query: 'filters and variables',
    facets: 'facets',
    search: 'search',
  };

  const isUser = $derived(message.role === 'user');
  const changedText = $derived(
    message.changed?.length
      ? `Updated ${message.changed.map((p) => PART_LABELS[p]).join(', ')}`
      : '',
  );
  const linkClass = 'underline text-primary-600-400 disabled:no-underline disabled:opacity-50';
</script>

{#if isUser}
  <div
    class="flex justify-end {startsExchange ? 'mt-3.5' : 'mt-0.5'}"
    data-testid="explorer-assistant-message-user"
  >
    <p
      class="max-w-[70%] whitespace-pre-wrap break-words rounded-[14px_14px_4px_14px] bg-primary-100-900 px-3.5 py-2 leading-snug"
    >
      {message.text}
    </p>
  </div>
{:else}
  <div class="group mt-2 max-w-[72ch]" data-testid="explorer-assistant-message-assistant">
    {#if message.failed}
      <p
        class="rounded-container border border-error-500 bg-error-50 px-3 py-2"
        data-testid="explorer-assistant-message-text"
      >
        {message.text}
      </p>
    {:else}
      <div class="flex items-end gap-1">
        <div
          class="chat-markdown min-w-0 break-words rounded-[14px_14px_14px_4px] bg-surface-100-900 leading-relaxed"
          data-testid="explorer-assistant-message-text"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized in renderChatMarkdown -->
          {@html renderChatMarkdown(message.text)}
        </div>
        <div
          class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <CopyButton
            itemToCopy={message.text}
            useIcon
            triggerTitle="Copy this reply"
            data-testid="explorer-assistant-copy"
            oncopy={() => log(createLog('CHAT', 'chat.copy'))}
          />
        </div>
      </div>
    {/if}
    {#if message.applyFailed}
      <p class="mt-2 text-sm" data-testid="explorer-assistant-apply-failed">
        The suggested changes could not be put on your screen.
      </p>
    {/if}
    {#if changedText}
      <div
        class="mt-2 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm border-surface-300-700 bg-surface-100-900 {message.undone
          ? 'opacity-70'
          : ''}"
      >
        <span
          class="font-semibold text-primary-600-400 {message.undone ? 'line-through' : ''}"
          data-testid="explorer-assistant-changed">{changedText}</span
        >
        {#if message.undone}
          <span class="sr-only" data-testid="explorer-assistant-undone">Undone</span>
        {/if}
        <button
          type="button"
          class="{linkClass} ml-auto focus-visible:outline-2 focus-visible:outline-primary-500"
          data-testid={message.undone ? 'explorer-assistant-redo' : 'explorer-assistant-undo'}
          disabled={undoState === 'locked'}
          title={undoState === 'locked' ? 'Disabled after you changed the screen' : undefined}
          onclick={message.undone ? onredo : onundo}>{message.undone ? 'Redo' : 'Undo'}</button
        >
      </div>
    {/if}
  </div>
{/if}

<style>
  .chat-markdown :global(p + p),
  .chat-markdown :global(ul),
  .chat-markdown :global(ol),
  .chat-markdown :global(pre),
  .chat-markdown :global(blockquote) {
    margin-top: 0.5rem;
  }
  .chat-markdown :global(ul) {
    list-style: disc;
    padding-left: 1.25rem;
  }
  .chat-markdown :global(ol) {
    list-style: decimal;
    padding-left: 1.25rem;
  }
  .chat-markdown :global(pre) {
    overflow-x: auto;
  }
  .chat-markdown :global(code) {
    font-family: monospace;
  }
  .chat-markdown :global(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    margin-top: 0.5rem;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .chat-markdown :global(th),
  .chat-markdown :global(td) {
    padding: 0.25rem 0.75rem;
    text-align: left;
    vertical-align: top;
    border: 1px solid light-dark(var(--color-surface-300), var(--color-surface-700));
  }
  .chat-markdown :global(th) {
    font-weight: 600;
    background: light-dark(var(--color-surface-100), var(--color-surface-900));
  }
  /* Concept paths are long and unbroken, so let them wrap inside their cell. */
  .chat-markdown :global(td code) {
    word-break: break-all;
  }
  .chat-markdown :global(a) {
    text-decoration: underline;
  }
</style>
