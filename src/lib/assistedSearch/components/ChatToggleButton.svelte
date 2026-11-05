<script lang="ts">
  interface Props {
    open: boolean;
    ontoggle: () => void;
  }

  let { open, ontoggle }: Props = $props();
</script>

<!-- The label never changes, so the search bar beside it never resizes. -->
<button
  type="button"
  class="btn w-36 border border-primary-500 {open
    ? 'preset-filled-primary-500'
    : 'preset-tonal-primary hover:preset-filled-primary-500'}"
  aria-pressed={open}
  data-testid="chat-toggle"
  title={open ? 'Hide the search assistant' : 'Ask the search assistant'}
  onclick={ontoggle}
>
  <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
  Assistant
</button>
