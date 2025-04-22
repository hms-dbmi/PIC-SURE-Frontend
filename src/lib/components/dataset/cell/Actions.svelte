<script lang="ts">
  import DataSetStore from '$lib/stores/Dataset';

  let { data = { cell: '', row: { archived: false } } } = $props();
  let toggleButton: HTMLButtonElement = $state() as HTMLButtonElement;

  async function toggleArchive(event: Event) {
    event.stopPropagation();
    toggleButton.disabled = true;
    DataSetStore.toggleArchived(data.cell);
    toggleButton.disabled = false;
  }
</script>

{#if data.row.archived}
  <!-- <button
    disabled
    data-testid={`dataset-action-view-${data.cell}`}
    type="button"
    title="View"
    class="btn-icon-color"
  >
    <i class="fa-solid fa-circle-info fa-xl"></i>
  </button> -->
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
  <!-- <button
    data-testid={`dataset-action-view-${data.cell}`}
    type="button"
    title="View"
    class="btn-icon-color"
    onclick={() => goto(`/dataset/${data.cell}`)}
  >
    <i class="fa-solid fa-circle-info fa-xl"></i>
  </button> -->
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
