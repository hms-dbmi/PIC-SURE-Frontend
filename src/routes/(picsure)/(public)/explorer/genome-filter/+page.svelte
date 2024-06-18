<script lang="ts">
  import { onMount } from 'svelte';
  import { branding } from '$lib/configuration';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { goto } from '$app/navigation';

  import Content from '$lib/components/Content.svelte';
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import Stepper from '$lib/components/steppers/horizontal/Stepper.svelte';
  import Step from '$lib/components/steppers/horizontal/Step.svelte';
  import Panel from '$lib/components/explorer/Panel.svelte';
  import FilterType from '$lib/components/explorer/gemone-filter/FilterType.svelte';
  import SelectGenes from '$lib/components/explorer/gemone-filter/SelectGenes.svelte';
  import SelectFrequency from '$lib/components/explorer/gemone-filter/SelectFrequency.svelte';
  import SelectedConsequence from '$lib/components/explorer/gemone-filter/SelectedConsequence.svelte';
  import FilterSummary from '$lib/components/explorer/gemone-filter/FilterSummary.svelte';
  import SnpSearch from '$lib/components/explorer/gemone-filter/SNPSearch.svelte';

  import { VariantKeys } from '$lib/models/InfoColumns';
  import { Option } from '$lib/models/GemoneFilter';
  import GeneFilterStore from '$lib/stores/GenomicFilter';
  import FilterStore from '$lib/stores/Filter';
  import InfoColumns from '$lib/stores/InfoColumns';
  let {
    selectedOption,
    selectedGenes,
    selectedFrequency,
    selectedConsequence,
    snpSearch,
    snpConstraint,
    generateFilter,
    clearGeneFilters,
    clearFilters,
  } = GeneFilterStore;
  let { addFilter } = FilterStore;
  let { error: infoColumnError, loadInfoColumns, getInfoColumn } = InfoColumns;

  function clearSelectedGenes() {
    selectedGenes.set([]);
  }

  function onComplete() {
    const filter = generateFilter();
    addFilter(filter);
    clearFilters();
    goto('/explorer');
  }

  onMount(async () => {
    await loadInfoColumns();
    if ($infoColumnError) {
      toastStore.trigger({
        message: $infoColumnError,
        background: 'variant-filled-error',
      });
    }
  });

  $: canComplete =
    ($selectedOption === Option.Genomic &&
      ($selectedGenes.length > 0 ||
        $selectedFrequency.length > 0 ||
        $selectedConsequence.length > 0)) ||
    ($selectedOption === Option.SNP && $snpSearch !== '' && $snpConstraint !== '');
</script>

<svelte:head>
  <title>{branding.applicationName} | Gemonic Filter</title>
</svelte:head>

<Content backUrl="/explorer" backAction={() => clearFilters()} backTitle="Back to Cohort builder">
  <h2 class="text-center mb-4 text-3xl">Genomic Filtering</h2>
  <Stepper
    buttonCompleteLabel="Apply Filter"
    startStep={$selectedOption === Option.None ? 0 : 1}
    on:complete={onComplete}
    bind:canComplete
    class="mx-5 p-4 border rounded-md border-surface-500-400-token"
  >
    <Step title="Select Search Type" locked={$selectedOption === Option.None}>
      <FilterType />
    </Step>
    <Step
      title={$selectedOption === Option.Genomic ? undefined : 'Specific SNP'}
      locked={!canComplete}
    >
      {#if $selectedOption === Option.Genomic}
        <div class="flex gap-3">
          <Panel
            title="Gene with Variant"
            subtitle={getInfoColumn(VariantKeys.gene)}
            required={true}
            class="w-2/3"
          >
            <svelte:fragment slot="action">
              <button class="btn btn-xs variant-ringed-surface" on:click={clearSelectedGenes}
                >Clear</button
              >
            </svelte:fragment>
            <SelectGenes />
          </Panel>
          <Panel title="Select Variant frequency" class="w-1/3">
            <svelte:fragment slot="help">
              <HelpInfoPopup id="freq-help-popup" text={getInfoColumn(VariantKeys.frequency)} />
            </svelte:fragment>
            <SelectFrequency />
          </Panel>
        </div>
        <div class="flex gap-3">
          <Panel title="Variant Consequence calculated" class="w-1/2">
            <svelte:fragment slot="help">
              {#if getInfoColumn(VariantKeys.consequence) && getInfoColumn(VariantKeys.severity)}
                <HelpInfoPopup
                  id="cons-help-popup"
                  text={getInfoColumn(VariantKeys.consequence) +
                    ' Severity: ' +
                    getInfoColumn(VariantKeys.severity)}
                />
              {/if}
            </svelte:fragment>
            <SelectedConsequence />
          </Panel>
          <Panel title="Selected Genomic Filters" class="w-3/4">
            <svelte:fragment slot="action">
              <button class="btn btn-xs variant-ringed-surface" on:click={clearGeneFilters}
                >Clear</button
              >
            </svelte:fragment>
            <FilterSummary />
          </Panel>
        </div>
      {:else}
        <SnpSearch />
      {/if}
    </Step>
  </Stepper>
</Content>
