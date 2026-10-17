<script lang="ts">
  import { toaster } from '#lib/ui/toaster.ts';

  import { toggleArchived } from '#lib/datasets/datasets.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  interface Props {
    data?: { cell: string; row: { archived: boolean } };
  }

  const { data = { cell: '', row: { archived: false } } }: Props = $props();
  let pending = $state(false);

  async function toggleArchive(event: Event) {
    event.stopPropagation();
    const isArchiving = !data.row.archived;
    log(
      createLog('DATASET', isArchiving ? 'dataset.archive' : 'dataset.restore', {
        datasetId: data.cell,
      }),
    );

    pending = true;
    try {
      await toggleArchived(data.cell);
    } catch {
      toaster.error({ title: 'An error occurred when updating dataset.' });
    } finally {
      pending = false;
    }
  }
</script>

{#if data.row.archived}
  <button
    disabled={pending}
    data-testid={`dataset-action-restore-${data.cell}`}
    type="button"
    title="Restore (r)"
    aria-label="Restore (r)"
    data-key="r"
    class="btn-icon-color"
    onclick={toggleArchive}
  >
    <i class="fa-solid fa-trash-arrow-up fa-xl"></i>
  </button>
{:else}
  <button
    disabled={pending}
    data-testid={`dataset-action-archive-${data.cell}`}
    type="button"
    title="Delete (d)"
    aria-label="Delete (d)"
    data-key="d"
    class="btn-icon-color"
    onclick={toggleArchive}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
  </button>
{/if}
