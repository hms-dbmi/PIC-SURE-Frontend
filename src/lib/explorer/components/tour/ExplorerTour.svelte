<script lang="ts">
  import { onMount } from 'svelte';
  import 'driver.js/dist/driver.css';
  import '../../../../styles/tour.css';

  import { sanitizeHTML } from '#lib/utils/html.ts';
  import type { TourDataType } from '#lib/explorer/components/tour/types.ts';
  import { createExplorerTour } from '#lib/explorer/components/tour/explorerTour.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';

  import Button from '#lib/ui/Button.svelte';
  import Dialog from '#lib/ui/dialog/Dialog.svelte';
  import Loading from '#lib/ui/Loading.svelte';

  interface Props {
    tourConfig: TourDataType;
    /** Open the tour's instructions as soon as the button mounts. */
    autostart?: boolean;
  }

  let { tourConfig, autostart = false }: Props = $props();

  const tour = $derived(createExplorerTour(tourConfig));
  let started: boolean = $state(false);
  let openModal: boolean = $state(false);

  function openInstructions() {
    started = false;
    openModal = true;
    log(createLog('ACTION', 'tour.open', { pageContext: getPageContext() }));
  }

  async function startTour() {
    started = true;
    if (!(await tour.start())) started = false;
  }

  onMount(() => {
    if (autostart) openInstructions();
  });
</script>

{#snippet tourActions()}
  <Button variant="soft" onclick={() => (openModal = false)}>Cancel</Button>
  <Button onclick={startTour}>Start Tour</Button>
{/snippet}

<Dialog
  bind:open={openModal}
  title={tourConfig.title}
  size="third"
  footer={started ? undefined : tourActions}
>
  {#if started}
    <Loading ring size="large" />
  {:else}
    <p>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html sanitizeHTML(tourConfig.description)}
    </p>
  {/if}
</Dialog>
<Button
  data-testid="explorer-tour-start"
  id="explorer-tour-start"
  variant="filled-secondary"
  onclick={openInstructions}
  >Take a Tour
</Button>
