<script lang="ts">
  interface Props {
    open: boolean;
    ontoggle: () => void;
  }

  let { open, ontoggle }: Props = $props();
</script>

<button
  type="button"
  class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
  aria-pressed={open}
  data-testid="chat-toggle"
  title={open ? 'Go back to the search box' : 'Ask the search assistant'}
  onclick={ontoggle}
>
  <i class="fas {open ? 'fa-search' : 'fa-comments'}" aria-hidden="true"></i>
  {open ? 'Search box' : 'Assistant'}
</button>
