<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import { renderChatMarkdown } from '../model/markdown';
  import type { ChatMessage, ScreenPart } from '../model/types';

  interface Props {
    message: ChatMessage;
    canUndo?: boolean;
    onundo?: () => void;
  }

  let { message, canUndo = false, onundo = () => {} }: Props = $props();

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
  const messageClass = $derived(
    isUser
      ? 'bg-primary-50'
      : message.failed
        ? 'bg-error-50 border border-error-500'
        : 'bg-surface-100',
  );
</script>

<div
  class="flex {isUser ? 'justify-end' : 'justify-start'}"
  data-testid="chat-message-{message.role}"
>
  <div class="max-w-[85%] rounded-container px-4 py-2 {messageClass}">
    {#if isUser}
      <p class="whitespace-pre-wrap break-words">{message.text}</p>
    {:else}
      <div class="chat-markdown break-words" data-testid="chat-message-text">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized in renderChatMarkdown -->
        {@html renderChatMarkdown(message.text)}
      </div>
      {#if message.applyFailed}
        <p class="mt-2 text-sm" role="alert">
          The suggested changes could not be put on your screen.
        </p>
      {/if}
      <div class="mt-1 flex items-center gap-3 text-sm">
        {#if changedText}
          <span data-testid="chat-changed">{changedText}</span>
          {#if canUndo}
            <button
              type="button"
              class="underline hover:text-primary-500"
              data-testid="chat-undo"
              onclick={onundo}>Undo</button
            >
          {:else if message.undone}
            <span data-testid="chat-undone">Undone</span>
          {/if}
        {/if}
        {#if !message.failed}
          <CopyButton
            itemToCopy={message.text}
            useIcon
            triggerTitle="Copy this reply"
            class="ml-auto"
            data-testid="chat-copy"
            logAction="chat.copy"
            logEventType="CHAT"
          />
        {/if}
      </div>
    {/if}
  </div>
</div>

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
  .chat-markdown :global(a) {
    text-decoration: underline;
  }
</style>
