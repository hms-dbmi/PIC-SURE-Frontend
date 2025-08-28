<script lang="ts">
  import Summary from '$lib/components/explorer/export/Summary.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';

  interface Props {
    activeType: string | undefined;
  }

  let { activeType }: Props = $props();
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  <div class="grid gap-10 grid-cols-2">
    <CardButton
      data-testid="csv-export-option"
      title="Export as Data Frame or CSV"
      subtitle="Export data as a Python or R data frame or a comma-separated values file"
      size="other"
      active={activeType === 'DATAFRAME'}
      onclick={() => (activeType = 'DATAFRAME')}
    ></CardButton>
    <CardButton
      data-testid="pfb-export-option"
      title="Export as PFB"
      subtitle="Export data in Portable Format for Biomedical Data file format"
      size="other"
      active={activeType === 'DATAFRAME_PFB'}
      onclick={() => (activeType = 'DATAFRAME_PFB')}
    ></CardButton>
  </div>
</section>
