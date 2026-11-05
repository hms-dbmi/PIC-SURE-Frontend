<script lang="ts">
  interface Props {
    pending: boolean;
    onsend: (text: string) => void;
    onstop: () => void;
  }

  let { pending, onsend, onstop }: Props = $props();

  let text = $state('');

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
  class="flex gap-2 items-end"
  onsubmit={(e) => {
    e.preventDefault();
    submit();
  }}
>
  <textarea
    class="textarea flex-auto resize-none"
    rows="2"
    maxlength="4000"
    placeholder="Ask about the data, e.g. which studies measure blood pressure?"
    aria-label="Message the search assistant"
    data-testid="chat-input"
    bind:value={text}
    {onkeydown}></textarea>
  {#if pending}
    <span class="flex items-center gap-2 pb-2" role="status">
      <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
      <span class="sr-only">The assistant is working</span>
    </span>
    <button
      type="button"
      class="btn preset-tonal-error border border-error-500"
      data-testid="chat-stop"
      onclick={onstop}>Stop</button
    >
  {:else}
    <button
      type="submit"
      class="btn preset-filled-primary-500"
      data-testid="chat-send"
      disabled={!text.trim()}>Send</button
    >
  {/if}
</form>
