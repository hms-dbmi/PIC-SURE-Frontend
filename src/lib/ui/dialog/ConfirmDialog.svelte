<script lang="ts">
  import type { Snippet } from 'svelte';
  import Dialog, { type DialogSize, type DialogTriggerProps } from '#lib/ui/dialog/Dialog.svelte';
  import Button from '#lib/ui/Button.svelte';

  interface Props extends DialogTriggerProps {
    open?: boolean;
    title: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'default' | 'danger';
    closeable?: boolean;
    size?: DialogSize;
    'data-testid'?: string;
    onconfirm: () => void;
    /** Runs on every close that isn't a confirm: the cancel button, Escape, a backdrop click, ×. */
    oncancel?: () => void;
    children: Snippet;
  }

  let {
    open = $bindable(false),
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'default',
    onconfirm,
    oncancel,
    children,
    ...rest
  }: Props = $props();

  const confirmVariant = { default: 'filled', danger: 'filled-error' } as const;

  // The handler runs before the dialog closes: a caller that binds open to state its handler
  // reads (an unsaved-changes guard's pending transition) would otherwise see it cleared.
  function cancel() {
    oncancel?.();
    open = false;
  }

  function confirm() {
    onconfirm();
    open = false;
  }
</script>

<Dialog bind:open onclose={oncancel} {...rest}>
  {@render children()}
  {#snippet footer()}
    <Button variant="soft" onclick={cancel}>{cancelLabel}</Button>
    <Button variant={confirmVariant[tone]} onclick={confirm}>{confirmLabel}</Button>
  {/snippet}
</Dialog>
