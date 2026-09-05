<script lang="ts">
  import type { Snippet } from 'svelte';
  import Modal from '$lib/components/Modal.svelte';

  interface Props {
    open: boolean;
    keepLabel: string;
    discardLabel: string;
    onkeep: () => void;
    ondiscard: () => void;
    children: Snippet;
  }

  let { open, keepLabel, discardLabel, onkeep, ondiscard, children }: Props = $props();
</script>

<Modal {open} title="Unsaved Changes" closeable={false}>
  <p class="mb-6">{@render children()}</p>
  <footer class="flex justify-end gap-2">
    <button type="button" class="btn border preset-tonal-primary" onclick={onkeep}>
      {keepLabel}
    </button>
    <button type="button" class="btn preset-filled-error-500" onclick={ondiscard}>
      {discardLabel}
    </button>
  </footer>
</Modal>
