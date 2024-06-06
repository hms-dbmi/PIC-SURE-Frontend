<script lang="ts">
  import { goto } from '$app/navigation';

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
  <button
    disabled
    data-testid={`dataset-action-view-${data.cell}`}
    type="button"
    class="btn bg-primary-500 text-on-primary-token">View</button
  >
  <button
    bind:this={toggleButton}
    data-testid={`dataset-action-restore-${data.cell}`}
    type="button"
    class="btn bg-secondary-500 text-on-secondary-token loader"
    on:click|stopPropagation={toggleArchive}>Restore</button
  >
{:else}
  <button
    data-testid={`dataset-action-view-${data.cell}`}
    type="button"
    title="View"
    class="btn bg-primary-500 text-on-primary-token"
    on:click|stopPropagation={() => goto(`/dataset/${data.cell}`)}>View</button
  >
  <button
    bind:this={toggleButton}
    data-testid={`dataset-action-archive-${data.cell}`}
    type="button"
    class="btn bg-secondary-500 text-on-secondary-token loader"
    on:click|stopPropagation={toggleArchive}>Archive</button
  >
{/if}
