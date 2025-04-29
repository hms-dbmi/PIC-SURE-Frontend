<script lang="ts">
  import type { SNP } from '$lib/models/GenomeFilter';
  import { getSNPCounts } from '$lib/stores/SNPFilter';

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

  const validSnpPattern = /^\w+,\d+,(A|T|C|G)+,(A|T|C|G)+$/;
  let searchElement: HTMLInputElement;
  let warn: boolean = $state(false);
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
    warn = false;
  }

  async function searchSnp() {
    searching = true;
    let valid: boolean;
    try {
      valid = (await getSNPCounts({ search: searchStringElement, constraint: '' })) > 0;
    } catch (_e) {
      valid = false;
    }
    searching = false;
    if (valid) {
      onvalid({ search: searchStringElement, constraint: '' });
    } else {
      warn = true;
    }
  }
</script>

<p class="text-center">
  Enter the following information into the search bar: chromosome, position, reference allele,
  variant allele.
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
{#if warn}
  <ErrorAlert>
    We couldn't find any results for your search term. Please check to ensure the information you
    have entered is correct or try a different search.
  </ErrorAlert>
{/if}
