<script lang="ts">
  import { resources } from '$lib/configuration';
  import * as api from '$lib/api';

  const validSnp = /\w+,\d+,(A|T|C|G)+, ?(A|T|C|G)+/;

  async function hasCounts(search: string) {
    // Search for results with Heterozygous or Homozygous variants. If there are none, then we know that this
    // snp isn't set anywhere and the user doesn't need to include or exclude it.
    const requestBody = {
      resourceUUID: resources.hpds,
      query: {
        categoryFilters: { [search]: ['1/1', '0/1'] },
        numericFilters: {},
        requiredFields: [],
        anyRecordOf: [],
        variantInfoFilters: [{ categoryVariantInfoFilters: {}, numericVariantInfoFilters: {} }],
        expectedResultType: 'COUNT',
      },
    };
    const response = await api.post('/picsure/query/sync', requestBody);
    return response > 0;
  }

  export let search: string = '';
  export let constraints: string = '';

  let noResults: boolean = false;

  let searchElement: HTMLInputElement;

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
    noResults = false;
  }

  async function submitSNP() {
    const searchValue = searchElement.value.replaceAll(' ', '');
    if (!validSnp.test(searchValue)) {
      setInvalid();
      return;
    }

    removeInvalid();
    const hasResults = await hasCounts(searchValue);
    if (hasResults) {
      search = searchValue;
    } else {
      noResults = true;
    }
  }

  function clear() {
    search = '';
    constraints = '';
  }
</script>

<p>
  Use the variant information obtained from
  <a href="https://www.ncbi.nlm.nih.gov/snp/" target="_blank">dbSNP</a> to search for a specific
  SNP. For instructions on how to find the variant information click
  <a
    href="https://pic-sure.gitbook.io/genomic-information-commons/user-journey/1.-explore-data-and-create-a-cohort/variant-search-rsids"
    target="_blank">here</a
  >.
</p>
<div class="border rounded border-surface-500-400-token p-3">
  {#if !search}
    <p class="text-center">
      Enter the following variant information separated by a comma in the space below:
    </p>
    <p class="text-center">chromosome (chr#), position, reference allele, variant allele</p>
    <p class="text-center font-bold my-6"><em class="font-bold">Example:</em> chr17,35269878,G,A</p>
    <div class="flex gap-2 justify-center my-6">
      <input
        type="search"
        class="input"
        placeholder="chromosome (chr#), position, reference allele, variant allele"
        data-testid="snp-search-box"
        on:input={removeInvalid}
        bind:this={searchElement}
      />
      <button
        class="btn text-primary-500"
        aria-label="Search"
        title="Search"
        type="submit"
        data-testid="snp-search-btn"
        on:click={submitSNP}
      >
        <i class="fa-solid fa-plus border border-primary-500-400-token rounded-full p-1 mr-3"></i> Add
        SNP
      </button>
    </div>
    {#if noResults}
      <aside class="alert variant-ghost-error">
        <div class="alert-message">
          <p>
            We couldn't find any results for your search term. Please check to ensure the
            information you have entered is correct or try a different search.
          </p>
        </div>
      </aside>
    {/if}
  {:else}
    <p class="text-center">
      Select the genotype of interest for the specified variant.
      <button class="btn btn-xs variant-ringed-surface" on:click={clear}>Clear</button>
    </p>
    <div class="flex gap-2 items-center justify-center my-6">
      <label class="mr-4">
        <input class="checkbox" type="checkbox" checked disabled />
        {search}
      </label>
      <select class="select w-96" data-testid="snp-constraint" required bind:value={constraints}>
        <option selected disabled value>Select Genotype</option>
        <option value="0/1">Heterozygous</option>
        <option value="1/1">Homozygous</option>
        <option value="1/1,0/1">Heterozygous or homozygous</option>
        <option value="0/0">Exclude variant</option>
      </select>
    </div>
  {/if}
</div>
