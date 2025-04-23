<script lang="ts">
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
  import type { SNP } from '$lib/models/GenomeFilter';
  import { getSNPCounts } from '$lib/stores/SNPFilter';

  const {
    search = '',
    disabled = false,
    onvalid = () => {},
  }: {
    search?: string;
    disabled?: boolean;
    onvalid?: (snp: SNP) => void;
  } = $props();

  const validSnp = /^\w+,\d+,(A|T|C|G)+,(A|T|C|G)+$/;
  let searchElement: HTMLInputElement;
  let warn: boolean = $state(false);
  let searching: boolean = $state(false);
  let searchStringElement: string = $state(search);
  const toastStore = getToastStore();

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

  $effect(() => {
    // remove warnings on search value change.
    searchStringElement && removeInvalid();
  });

  async function searchSnp() {
    if (!validSnp.test(searchStringElement)) {
      setInvalid();
      return;
    } else {
      removeInvalid();
    }

    searching = true;
    try {
      const valid = (await getSNPCounts({ search: searchStringElement, constraint: '' })) > 0;
      if (valid) {
        onvalid({ search: searchStringElement, constraint: '' });
      } else {
        warn = true;
      }
    } catch (err) {
      console.error('SNP search error:', err);
      toastStore.trigger({
        message: 'An error occurred while searching for SNP data. Please try again later.',
        background: 'variant-filled-error',
        timeout: 5000,
      });
    } finally {
      searching = false;
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
    oninput={removeInvalid}
  />
  <button
    type="button"
    data-testid="snp-search-btn"
    class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"
    onclick={searchSnp}
    disabled={disabled || !search || searching}
  >
    Search
    {#if searching}
      <ProgressRing
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
  <aside class="alert preset-tonal-error border border-error-500">
    <div class="alert-message">
      <p>
        We couldn't find any results for your search term. Please check to ensure the information
        you have entered is correct or try a different search.
      </p>
    </div>
  </aside>
{/if}
