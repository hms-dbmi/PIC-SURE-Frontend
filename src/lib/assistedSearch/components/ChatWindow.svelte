<script lang="ts">
  import { onMount, tick } from 'svelte';

  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import TimedLoading, { type TimedMessage } from '#lib/ui/TimedLoading.svelte';

  import type { ChatSession } from '../chat.svelte.ts';
  import ChatInput from './ChatInput.svelte';
  import ChatMessage from './ChatMessage.svelte';

  let { session }: { session: ChatSession } = $props();

  const LOADING_MESSAGES: TimedMessage[] = [
    { afterMs: 0, text: 'Thinking…' },
    { afterMs: 3000, text: 'Still working on it…' },
    { afterMs: 7000, text: 'Hang tight…' },
  ];

  // Shown once the request itself has given up and the stored answer is being checked for; no
  // action is needed from the researcher, so none is offered.
  const RECOVERING_MESSAGES: TimedMessage[] = [
    {
      afterMs: 0,
      text: 'This is taking longer than usual. The answer will show here when it is ready…',
    },
  ];

  const SUGGESTIONS = [
    'Which studies measure blood pressure?',
    'Find variables about smoking',
    'What can you help me with?',
  ];

  let thread: HTMLElement | undefined = $state();
  let confirmNew = $state(false);

  // The panel follows the researcher's screen only while it is showing.
  onMount(() => session.watch());

  // Follows the newest message while the researcher is at the bottom. Scrolling up to reread
  // stops it, and it resumes once they scroll back down. Sending a message always jumps down.
  const NEAR_BOTTOM_PX = 24;
  let following = true;

  function onscroll() {
    if (!thread) return;
    following = thread.scrollHeight - thread.scrollTop - thread.clientHeight <= NEAR_BOTTOM_PX;
  }

  $effect(() => {
    void session.pending;
    if (session.messages.at(-1)?.role === 'user') following = true;
    if (!following) return;
    tick().then(() => {
      if (following) thread?.scrollTo({ top: thread.scrollHeight });
    });
  });

  const ghost =
    'rounded-md px-2 py-1.5 text-sm hover:bg-surface-100-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';
</script>

<section
  class="rounded-container border border-surface-300-700 bg-surface-50-950 overflow-hidden"
  aria-label="Search assistant"
  data-testid="explorer-assistant-window"
>
  <header class="flex items-center justify-between border-b border-surface-200-800 py-2 pr-3 pl-4">
    <h2 class="flex items-center gap-2 text-sm font-semibold">
      <i class="fas fa-wand-magic-sparkles text-primary-500" aria-hidden="true"></i>
      Assistant
    </h2>
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="{ghost} disabled:opacity-50 disabled:hover:bg-transparent"
        data-testid="explorer-assistant-new"
        disabled={!session.messages.length}
        onclick={() => (confirmNew = true)}>New conversation</button
      >
      <button
        type="button"
        class="{ghost} min-w-[4.5rem]"
        data-testid="explorer-assistant-expand"
        aria-label={session.tall ? 'Compact assistant panel' : 'Expand assistant panel'}
        title={session.tall
          ? 'Make the assistant panel shorter'
          : 'Make the assistant panel taller'}
        onclick={() => (session.tall = !session.tall)}>{session.tall ? 'Compact' : 'Expand'}</button
      >
      <button
        type="button"
        class="{ghost} size-[30px] !p-0 text-lg leading-none"
        data-testid="explorer-assistant-close"
        aria-label="Hide the assistant"
        title="Hide the assistant"
        onclick={() => session.setOpen(false)}>×</button
      >
    </div>
  </header>
  <div
    bind:this={thread}
    class="flex flex-col overflow-y-auto px-5 pt-4 pb-2 {session.tall
      ? 'max-h-[62vh]'
      : 'max-h-[220px]'}"
    data-testid="explorer-assistant-thread"
    {onscroll}
  >
    {#if session.messages.length === 0}
      <div class="flex flex-col gap-3 pb-2">
        <p class="text-surface-700-300">
          Ask about variables, studies, or your cohort. I can add and edit filters for you.
        </p>
        <div class="flex flex-wrap gap-2">
          {#each SUGGESTIONS as suggestion (suggestion)}
            <button
              type="button"
              class="rounded-full border border-surface-300-700 bg-surface-100-900 px-3 py-1.5 text-sm text-primary-600-400 hover:bg-primary-50-950"
              data-testid="explorer-assistant-suggestion"
              onclick={() => session.send(suggestion)}>{suggestion}</button
            >
          {/each}
        </div>
      </div>
    {/if}
    <!-- Only the messages are announced. The status below is its own live region, so the two
         never read each other out. -->
    <!-- A failed reply shares its requestId with the user message it answers, hence the role in the key. -->
    <div class="flex flex-col" role="log" aria-live="polite" aria-label="Conversation">
      {#each session.messages as message, i (`${message.id}-${message.role}`)}
        <ChatMessage
          {message}
          startsExchange={i > 0 && message.role === 'user'}
          undoState={message.role === 'assistant' ? session.undoState(message.id) : 'locked'}
          onundo={() => session.undo(message.id)}
          onredo={() => session.redo(message.id)}
        />
      {/each}
    </div>
    {#if session.pending}
      <div class="mt-2 text-sm text-surface-600-400" data-testid="explorer-assistant-thinking">
        <TimedLoading
          size="micro"
          messages={session.recovering ? RECOVERING_MESSAGES : LOADING_MESSAGES}
        />
      </div>
    {/if}
  </div>
  <ChatInput
    pending={session.pending}
    onsend={(text) => session.send(text)}
    onstop={() => session.stop()}
  />
</section>

<ConfirmDialog
  bind:open={confirmNew}
  title="New conversation"
  confirmLabel="Start new"
  onconfirm={() => session.reset()}
>
  <p>Start a new conversation? Your filters stay as they are.</p>
</ConfirmDialog>
