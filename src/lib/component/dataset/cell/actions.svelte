<script lang="ts">
  import { page } from '$app/stores';
  import DataSetStore from '$lib/store/dataset';

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
    on:click={toggleArchive}><i class="fa-solid fa-circle-notch fa-spin mr-1" /> Restore</button
  >
{:else}
  <a
    data-testid={`dataset-action-view-${data.cell}`}
    href={`${$page.url.pathname}/${data.cell}`}
    class="btn bg-primary-500 text-on-primary-token">View</a
  >
  <button
    bind:this={toggleButton}
    data-testid={`dataset-action-archive-${data.cell}`}
    type="button"
    class="btn bg-secondary-500 text-on-secondary-token loader"
    on:click={toggleArchive}><i class="fa-solid fa-circle-notch fa-spin mr-1" /> Archive</button
  >
{/if}
