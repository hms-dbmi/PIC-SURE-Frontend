<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { toaster } from '#lib/ui/toaster.ts';

  import { datasets } from '#lib/datasets/datasets.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  interface Props {
    uuid: string;
    archived: boolean;
  }

  const { uuid, archived }: Props = $props();
  let pending = $state(false);

  async function toggleArchive(event: Event) {
    event.stopPropagation();
    const isArchiving = !archived;
    log(
      createLog('DATASET', isArchiving ? 'dataset.archive' : 'dataset.restore', {
        datasetId: uuid,
      }),
    );

    pending = true;
    try {
      await datasets.toggleArchived(uuid);
    } catch {
      toaster.error({ title: 'An error occurred when updating dataset.' });
    } finally {
      pending = false;
    }
  }
</script>

{#if archived}
  <IconButton
    icon="fa-solid fa-trash-arrow-up fa-xl"
    label="Restore (r)"
    disabled={pending}
    data-testid={`dataset-action-restore-${uuid}`}
    shortcut="r"
    onclick={toggleArchive}
  />
{:else}
  <IconButton
    icon="fa-solid fa-trash fa-xl"
    label="Delete (d)"
    disabled={pending}
    data-testid={`dataset-action-archive-${uuid}`}
    shortcut="d"
    onclick={toggleArchive}
  />
{/if}
