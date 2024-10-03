<script lang="ts">
  import DataSetStore from '$lib/stores/Dataset';

  export let data = { cell: '', row: { archived: false } };
  let toggleButton: HTMLButtonElement;

  async function toggleArchive() {
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
    class="btn-icon-color"
    on:click|stopPropagation={toggleArchive}
  >
    <i class="fa-solid fa-trash-arrow-up fa-xl"></i>
  </button>
{:else}
  <!-- <button
    data-testid={`dataset-action-view-${data.cell}`}
    type="button"
    title="View"
    class="btn-icon-color"
    on:click|stopPropagation={() => goto(`/dataset/${data.cell}`)}
  >
    <i class="fa-solid fa-circle-info fa-xl"></i>
  </button> -->
  <button
    bind:this={toggleButton}
    data-testid={`dataset-action-archive-${data.cell}`}
    type="button"
    title="Delete"
    class="btn-icon-color"
    on:click|stopPropagation={toggleArchive}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
  </button>
{/if}
