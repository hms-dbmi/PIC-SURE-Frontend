<script lang="ts">
  import type { SNP } from '$lib/models/GenomeFilter';
  import { getSNPCounts } from '$lib/stores/SNPFilter';
  import { branding } from '$lib/configuration';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';

  const {
    search = '',
    disabled = false,
    onvalid = () => {},
  }: {
    search?: string;
    disabled?: boolean;
    onvalid?: (snp: SNP) => void;
  } = $props();

  interface Warning {
    color: string;
    message: string;
  }

  const Warnings: { [key: string]: Warning } = {
    NoResults: {
      color: 'error',
      message:
        "We couldn't find any results for your search term. Please check to ensure the information you have entered is correct or try a different search.",
    },
    SomeResults: {
      color: 'warning',
      message:
        'Some sites did not return patient counts for your search. Click the Add Filter button to apply your filter and click Cohort Details for more information.',
    },
  };

  const genomeBuild = branding.genomic?.defaultGenomeBuild || 'GRCh38';
  const validSnpPattern = /^\w+,\d+,(A|T|C|G)+,(A|T|C|G)+$/;
  let searchElement: HTMLInputElement;
  let warn: Warning | undefined = $state(undefined);
  let searching: boolean = $state(false);
  let searchStringElement: string = $state(search);
  let validSNPString: boolean = $derived(validSnpPattern.test(searchStringElement));
  $effect(() => {
    if (searchStringElement && !validSNPString) {
      setInvalid();
      return;
    } else {
      removeInvalid();
    }
  });

  function setInvalid() {
    searchElement.classList.add('required');
    searchElement.setCustomValidity(
      'Please check that value matches: chromosome (chr#), position, reference allele, variant allele.',
    );
    searchElement.reportValidity();
  }

  function removeInvalid() {
    searchElement.classList.remove('required');
    searchElement.setCustomValidity('');
    warn = undefined;
  }

  async function searchSnp() {
    searching = true;
    const snpOptions = { search: searchStringElement, constraint: '' };
    const { count, errors } = await getSNPCounts(snpOptions);
    searching = false;

    if (errors === 0 && count > 0) {
      onvalid(snpOptions);
    } else if (count > 0) {
      warn = Warnings.SomeResults;
      onvalid(snpOptions);
    } else {
      warn = Warnings.NoResults;
    }
  }
</script>

<p class="text-center">
  Enter the following information into the search bar using genome build {genomeBuild}: chromosome,
  position, reference allele, variant allele.
</p>
<p class="text-center">
  If you have the rsID of the variant, you can use the <a
    href="https://www.ncbi.nlm.nih.gov/snp/"
    target="_blank"
    rel="noopener noreferrer"
    class="anchor">dbSNP database</a
  > to find the genomic coordinates.
</p>
<p class="text-center font-bold my-6"><em class="font-bold">Example:</em> chr5,148481541,T,A</p>
<div class="flex gap-2 mx-auto my-8 w-1/2">
  <input
    type="search"
    class="input"
    placeholder="chromosome (chr#), position, reference allele, variant allele"
    data-testid="snp-search-box"
    {disabled}
    bind:this={searchElement}
    bind:value={searchStringElement}
    onkeydown={removeInvalid}
  />
  <button
    type="button"
    data-testid="snp-search-btn"
    class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"
    onclick={searchSnp}
    disabled={disabled || !validSNPString || searching}
  >
    Search
    {#if searching}
      <Loading ring size="micro" color="white" />
    {/if}
  </button>
</div>
{#if warn}<ErrorAlert color={warn.color}>{warn.message}</ErrorAlert>{/if}
