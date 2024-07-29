<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import type { SNP } from '$lib/models/GenomeFilter';
  import { getSNPCounts } from '$lib/stores/SNPFilter';

  export let search: string = '';

  const dispatch = createEventDispatcher<{ valid: { snp: SNP } }>();
  const validSnp = /^\w+,\d+,(A|T|C|G)+,(A|T|C|G)+$/;
  let searchElement: HTMLInputElement;
  let warn: boolean = false;
  let searching: boolean = false;

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
    if (!validSnp.test(search)) {
      setInvalid();
      return;
    } else {
      removeInvalid();
    }

    searching = true;
    const valid = (await getSNPCounts({ search, constraint: '' })) > 0;
    searching = false;
    if (valid) {
      dispatch('valid', { snp: { search, constraint: '' } });
    } else {
      warn = true;
    }
  }
</script>

<p class="text-center">
  Enter the following information into the search bar: chromosome, position, reference allele,
  variant allele.
</p>
<p class="text-center font-bold my-6"><em class="font-bold">Example:</em> chr17,35269878,G,A</p>
<div class="flex gap-2 mx-auto my-8 w-1/2">
  <input
    type="search"
    class="input"
    placeholder="chromosome (chr#), position, reference allele, variant allele"
    data-testid="snp-search-box"
    disabled={$$props.disabled}
    bind:this={searchElement}
    bind:value={search}
    on:input={removeInvalid}
  />
  <button
    type="button"
    data-testid="snp-search-btn"
    class="btn btn-sm variant-filled-primary text-lg disabled:opacity-75"
    on:click={searchSnp}
    disabled={$$props.disabled || !search || searching}
  >
    Search
    {#if searching}
      <ProgressRadial
        value={undefined}
        width="w-4"
        meter="stroke-primary-100  dark:stroke-secondary-400"
        track="stroke-surface-900/100"
        class="ml-2"
      />
    {/if}
  </button>
</div>
{#if warn}
  <aside class="alert variant-ghost-error">
    <div class="alert-message">
      <p>
        We couldn't find any results for your search term. Please check to ensure the information
        you have entered is correct or try a different search.
      </p>
    </div>
  </aside>
{/if}
