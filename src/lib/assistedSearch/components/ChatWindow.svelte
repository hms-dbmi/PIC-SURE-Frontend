<script lang="ts">
  import { tick } from 'svelte';

  import type { ChatSession } from '../chat.svelte';
  import ChatInput from './ChatInput.svelte';
  import ChatMessage from './ChatMessage.svelte';

  interface Props {
    session: ChatSession;
    fullScreen?: boolean;
  }

  let { session, fullScreen = false }: Props = $props();

  let thread: HTMLElement | undefined = $state();

  // Follows the newest message, but only on a change in the thread, so scrolling up to reread
  // is not undone by an unrelated re-render.
  $effect(() => {
    void session.messages.length;
    void session.pending;
    tick().then(() => thread?.scrollTo({ top: thread.scrollHeight }));
  });
</script>

<section
  class="flex flex-col gap-3 {fullScreen ? 'h-[80vh] w-full' : ''}"
  aria-label="Search assistant"
  data-testid="chat-window"
>
  <header class="flex items-center justify-between">
    <h2 class="font-bold">Search assistant</h2>
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="text-sm underline hover:text-primary-500 disabled:no-underline disabled:opacity-50"
        data-testid="chat-new"
        disabled={!session.messages.length}
        onclick={() => session.reset()}>New conversation</button
      >
      <button
        type="button"
        class="hover:text-primary-500"
        data-testid="chat-expand"
        title={fullScreen ? 'Back to the search page' : 'Expand to full screen'}
        aria-label={fullScreen ? 'Back to the search page' : 'Expand to full screen'}
        onclick={() => (session.fullScreen = !session.fullScreen)}
      >
        <i class="fas {fullScreen ? 'fa-compress' : 'fa-expand'}" aria-hidden="true"></i>
      </button>
    </div>
  </header>
  <div
    bind:this={thread}
    class="flex flex-col gap-3 overflow-y-auto rounded-container border border-surface-300-700 p-3 {fullScreen
      ? 'flex-auto'
      : 'h-72'}"
    role="log"
    aria-live="polite"
    data-testid="chat-thread"
  >
    {#if session.messages.length === 0}
      <p class="text-surface-600-400 m-auto text-center">
        Ask a question about the data. I can look things up, then set your search, facets and
        filters for you.
      </p>
    {/if}
    {#each session.messages as message (`${message.id}-${message.role}`)}
      <ChatMessage
        {message}
        canUndo={message.role === 'assistant' && session.canUndo(message.id)}
        onundo={() => session.undo(message.id)}
      />
    {/each}
  </div>
  <ChatInput
    pending={session.pending}
    onsend={(text) => session.send(text)}
    onstop={() => session.stop()}
  />
</section>
