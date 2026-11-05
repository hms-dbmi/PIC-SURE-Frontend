<script lang="ts">
  import TimedLoading, { type TimedMessage } from '$lib/components/TimedLoading.svelte';
  interface Props {
    pending: boolean;
    onsend: (text: string) => void;
    onstop: () => void;
  }

  const LOADING_MESSAGES: TimedMessage[] = [
    { afterMs: 0, text: 'Thinking...' },
    { afterMs: 3000, text: 'Still working on it…' },
    { afterMs: 7000, text: 'Hang tight…' },
  ];

  let { pending, onsend, onstop }: Props = $props();

  let text = $state('');
  let box: HTMLTextAreaElement | undefined = $state();

  // Grows with the draft up to the CSS max-height, then scrolls.
  $effect(() => {
    void text;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${box.scrollHeight}px`;
  });

  function submit() {
    const message = text.trim();
    if (!message || pending) return;
    onsend(message);
    text = '';
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      submit();
    }
  }
</script>

<form
  class="px-3 pb-3 pt-2"
  onsubmit={(e) => {
    e.preventDefault();
    submit();
  }}
>
  <!-- Styled like the search box: a rounded field joined to a filled button on its right. -->
  <div class="flex items-stretch">
    <textarea
      bind:this={box}
      class="chat-box w-full"
      rows="1"
      maxlength="4000"
      placeholder="Ask the assistant…"
      aria-label="Message the search assistant"
      data-testid="chat-input"
      bind:value={text}
      {onkeydown}></textarea>
    <button
      type="submit"
      class="btn preset-filled-primary-500 chat-button {pending
        ? 'w-52 disabled:opacity-100'
        : 'disabled:opacity-50'}"
      aria-label="Send"
      title="Send (Enter)"
      data-testid="chat-send"
      disabled={!text.trim()}
    >
      {#if pending}
        <TimedLoading size="micro" color="white" messages={LOADING_MESSAGES} />
      {:else}
        <i class="fas fa-paper-plane" aria-hidden="true"></i> Send
      {/if}
    </button>
    {#if pending}
      <button type="button" class="btn preset-tonal-error" data-testid="chat-stop" onclick={onstop}
        >Stop</button
      >
    {/if}
  </div>
  <p class="m-1 text-right text-xs text-surface-600-400">
    Enter to send · Shift+Enter for new line
  </p>
</form>

<style>
  .chat-box {
    border-radius: 9999px;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    margin-right: 0% !important;
  }
  .chat-button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding-right: 1rem;
    padding-left: 0.75rem;
  }
</style>
