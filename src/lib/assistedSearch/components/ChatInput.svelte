<script lang="ts">
  interface Props {
    pending: boolean;
    onsend: (text: string) => void;
    onstop: () => void;
  }

  let { pending, onsend, onstop }: Props = $props();

  const focusRing =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';

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
    // Send disables while the turn runs, which would drop focus to the page.
    box?.focus();
  }

  function stop() {
    onstop();
    // Stop disappears with the turn; keep the keyboard where the next message is typed.
    box?.focus();
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
      class="chat-box w-full {focusRing}"
      rows="1"
      maxlength="4000"
      placeholder="Ask the assistant…"
      aria-label="Message the search assistant"
      aria-describedby="chat-input-hint"
      data-testid="chat-input"
      bind:value={text}
      {onkeydown}></textarea>
    {#if pending}
      <button
        type="button"
        class="px-4 preset-tonal-error {focusRing}"
        title="Stop waiting for the reply"
        data-testid="chat-stop"
        onclick={stop}>Stop</button
      >
    {/if}
    <button
      type="submit"
      class="btn w-32 justify-start preset-filled-primary-500 chat-button disabled:opacity-50 {focusRing}"
      title="Send (Enter)"
      data-testid="chat-send"
      disabled={pending || !text.trim()}
    >
      <i class="fas fa-paper-plane" aria-hidden="true"></i> Send
    </button>
  </div>
  <p id="chat-input-hint" class="m-1 text-right text-xs text-surface-600-400">
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
