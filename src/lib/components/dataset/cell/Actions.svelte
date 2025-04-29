<script lang="ts">
  import { toaster } from '$lib/toaster';

  import { toggleArchived } from '$lib/stores/Dataset';

  const { data = { cell: '', row: { archived: false } } } = $props();
  let toggleButton: HTMLButtonElement = $state() as HTMLButtonElement;

  async function toggleArchive(event: Event) {
    event.stopPropagation();

    try {
      toggleButton.disabled = true;
      toggleArchived(data.cell);
      toggleButton.disabled = false;
    } catch (error) {
      toaster.error({ title: 'An error occured when updating dataset.' });
    }
  }
</script>

{#if data.row.archived}
  <button
    bind:this={toggleButton}
    data-testid={`dataset-action-restore-${data.cell}`}
    type="button"
    title="Restore"
    aria-label="Restore"
    class="btn-icon-color"
    onclick={toggleArchive}
  >
    <i class="fa-solid fa-trash-arrow-up fa-xl"></i>
  </button>
{:else}
  <button
    bind:this={toggleButton}
    data-testid={`dataset-action-archive-${data.cell}`}
    type="button"
    title="Delete"
    aria-label="Delete"
    class="btn-icon-color"
    onclick={toggleArchive}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
  </button>
{/if}
