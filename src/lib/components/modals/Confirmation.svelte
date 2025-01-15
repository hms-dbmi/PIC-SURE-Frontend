<script lang="ts">
  import { onMount } from 'svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';

  const modalStore = getModalStore();

  interface Props {
    message: string;
    onCancel?: () => void;
    onConfirm: () => void;
    cancelText?: string;
    confirmText?: string;
  }

  let {
    message = $bindable(),
    onCancel = $bindable(() => modalStore.close()),
    onConfirm = $bindable(),
    cancelText = $bindable('Cancel'),
    confirmText = $bindable('Accept'),
  }: Props = $props();

  onMount(() => {
    if ($modalStore[0]?.meta.onCancel) {
      onCancel = $modalStore[0]?.meta.onCancel;
    }
    if ($modalStore[0]?.meta.onConfirm) {
      onConfirm = $modalStore[0]?.meta.onConfirm;
    }
    if ($modalStore[0]?.meta.confirmText) {
      confirmText = $modalStore[0]?.meta.confirmText;
    }
    if ($modalStore[0]?.meta.cancelText) {
      cancelText = $modalStore[0]?.meta.cancelText;
    }
    if ($modalStore[0]?.meta.message) {
      message = $modalStore[0]?.meta.message;
    }
  });
</script>

<div class="flex flex-col gap-4">
  <p>{message}</p>
  <div class="flex justify-end gap-4">
    <button
      class="btn variant-ghost-surface hover:variant-filled-surface mt-6"
      onclick={() => onCancel()}>{cancelText}</button
    >
    <button class="btn variant-filled hover:variant-filled-primary mt-6" onclick={() => onConfirm()}
      >{confirmText}</button
    >
  </div>
</div>
