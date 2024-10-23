<script lang="ts">
  export let message: string;
  export let onCancel: () => void;
  export let onConfirm: () => void;
  export let cancelText: string = 'Cancel';
  export let confirmText: string = 'Accept';
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
