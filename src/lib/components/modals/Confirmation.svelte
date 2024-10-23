<script lang="ts">
  import { onMount } from 'svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';

  const modalStore = getModalStore();
  
  export let message: string;
  export let onCancel: () => void;
  export let onConfirm: () => void;
  export let cancelText: string = 'Cancel';
  export let confirmText: string = 'Accept';

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
      class="btn variant-filled-primary hover:variant-filled-secondary mt-6"
      on:click={() => onCancel()}>{cancelText}</button
    >
    <button
      class="btn variant-filled-primary hover:variant-filled-secondary mt-6"
      on:click={() => onConfirm()}>{confirmText}</button
    >
  </div>
</div>
