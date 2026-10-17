<script lang="ts">
  import type { Snippet } from 'svelte';
  import Dialog, { type DialogSize } from '#lib/ui/dialog/Dialog.svelte';

  interface Props {
    open?: boolean;
    title?: string;
    'aria-label'?: string;
    acknowledgeLabel?: string;
    closeable?: boolean;
    size?: DialogSize;
    'data-testid'?: string;
    onclose?: () => void;
    /** Replaces the single acknowledge button. */
    actions?: Snippet;
    children: Snippet;
  }

  let {
    open = $bindable(false),
    acknowledgeLabel = 'OK',
    onclose,
    actions,
    children,
    ...rest
  }: Props = $props();

  function acknowledge() {
    open = false;
    onclose?.();
  }
</script>

<Dialog bind:open role="alertdialog" {onclose} {...rest}>
  {@render children()}
  {#snippet footer()}
    {#if actions}
      {@render actions()}
    {:else}
      <button type="button" class="btn preset-filled-primary-500" onclick={acknowledge}
        >{acknowledgeLabel}</button
      >
    {/if}
  {/snippet}
</Dialog>
