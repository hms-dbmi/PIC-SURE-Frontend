<script lang="ts">
  import { onMount } from 'svelte';
  import { branding } from '$lib/configuration';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import Content from '$lib/components/Content.svelte';
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import Stepper from '$lib/components/steppers/horizontal/Stepper.svelte';
  import Step from '$lib/components/steppers/horizontal/Step.svelte';
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
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
    selectedGenes,
    selectedFrequency,
    selectedConsequence,
    snpSearch,
    snpConstraint,
    generateFilter,
    clearGeneFilters,
  } = GeneFilterStore;
  let { addFilter } = FilterStore;
  let { error: infoColumnError, loadInfoColumns, getInfoColumn } = InfoColumns;

  let selectedOption: Option = Option.Name;

  function onComplete() {
    const filter = generateFilter(selectedOption);
    addFilter(filter);
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
    (selectedOption === Option.Name &&
      ($selectedGenes.length > 0 ||
        $selectedFrequency.length > 0 ||
        $selectedConsequence.length > 0)) ||
    (selectedOption === Option.SNP && $snpSearch !== '' && $snpConstraint !== '');
</script>

<svelte:head>
  <title>{branding.applicationName} | Gemonic Filter</title>
</svelte:head>

<Content>
  <AngleButton href="/explorer">Back to Cohort builder</AngleButton>
  <h2 class="text-center mb-4">Genomic Filtering</h2>
  <Stepper
    buttonCompleteLabel="Apply Filter"
    on:complete={onComplete}
    bind:canComplete
    class="mx-5 p-4 border rounded-md border-surface-500-400-token"
  >
    <Step title="Select Filter Type">
      <FilterType
        bind:selectedOption
        on:update={(event) => (selectedOption = event.detail.option)}
      />
    </Step>
    <Step
      title={selectedOption === Option.Name ? 'Gene with Variant' : 'Specific SNP'}
      locked={!canComplete}
    >
      {#if selectedOption === Option.Name}
        <div class="flex gap-3">
          <Panel title="Select genes of interest" class="w-2/3">
            <svelte:fragment slot="help">
              <span class="text-error-500-400-token mr-2">Required</span>
              <HelpInfoPopup id="gene-help-popup" text={getInfoColumn(VariantKeys.gene)} />
            </svelte:fragment>
            <SelectGenes />
          </Panel>
          <Panel title="Select variant frequency" class="w-1/3">
            <svelte:fragment slot="help">
              <HelpInfoPopup id="freq-help-popup" text={getInfoColumn(VariantKeys.frequency)} />
            </svelte:fragment>
            <SelectFrequency />
          </Panel>
        </div>
        <div class="flex gap-3">
          <Panel title="Variant consequence calculated" class="w-1/2">
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
          <Panel title="Selected Genomic Filters" class="w-1/2">
            <svelte:fragment slot="help">
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
