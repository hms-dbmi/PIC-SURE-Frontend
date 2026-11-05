<script lang="ts">
  import Button from '#lib/ui/Button.svelte';

  interface Props {
    open: boolean;
    ontoggle: () => void;
  }

  let { open, ontoggle }: Props = $props();
</script>

<!-- The label never changes, so the search bar beside it never resizes. -->
<Button
  variant={open ? 'filled-bordered' : 'tonal'}
  class="w-36"
  aria-pressed={open}
  data-testid="chat-toggle"
  title={open ? 'Hide the search assistant' : 'Ask the search assistant'}
  onclick={ontoggle}
>
  <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
  Assistant
</Button>
