<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '#lib/ui/Button.svelte';
  import Dialog, { type DialogName, type DialogSize } from '#lib/ui/dialog/Dialog.svelte';

  type Props = DialogName & {
    open?: boolean;
    acknowledgeLabel?: string;
    closeable?: boolean;
    size?: DialogSize;
    'data-testid'?: string;
    onclose?: () => void;
    /** Replaces the single acknowledge button. */
    actions?: Snippet;
    children: Snippet;
  };

  let {
    open = $bindable(false),
    acknowledgeLabel = 'OK',
    onclose,
    actions,
    children,
    ...rest
  }: Props = $props();

  function acknowledge() {
    onclose?.();
    open = false;
  }
</script>

<Dialog bind:open role="alertdialog" {onclose} {...rest}>
  {@render children()}
  {#snippet footer()}
    {#if actions}
      {@render actions()}
    {:else}
      <Button onclick={acknowledge}>{acknowledgeLabel}</Button>
    {/if}
  {/snippet}
</Dialog>
