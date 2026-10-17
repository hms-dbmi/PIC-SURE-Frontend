<script lang="ts">
  import type { Snippet } from 'svelte';
  import Dialog, { type DialogSize, type DialogTriggerProps } from '#lib/ui/dialog/Dialog.svelte';

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

  const confirmClass = {
    default: 'btn preset-filled-primary-500',
    danger: 'btn preset-filled-error-500',
  };

  function cancel() {
    open = false;
    oncancel?.();
  }

  function confirm() {
    open = false;
    onconfirm();
  }
</script>

<Dialog bind:open onclose={oncancel} {...rest}>
  {@render children()}
  {#snippet footer()}
    <button
      type="button"
      class="btn border preset-tonal-primary hover:preset-filled-primary-500"
      onclick={cancel}>{cancelLabel}</button
    >
    <button type="button" class={confirmClass[tone]} onclick={confirm}>{confirmLabel}</button>
  {/snippet}
</Dialog>
