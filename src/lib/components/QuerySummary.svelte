<script lang="ts">
  // TODO: use query type instead of any

  interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query?: any;
  }

  let { query = {} }: Props = $props();

  const fieldList = Object.entries({
    fields: query?.fields,
    requiredFields: query?.requiredFields,
    anyRecordOf: query?.anyRecordOf,
    anyRecordOfMulti: query?.anyRecordOfMulti.flat(),
    crossCountFields: query?.crossCountFields,
  });
</script>

<section id="detail-filters-container" class="m-3">
  <p class="font-bold text-left my-1">Filters Applied</p>
  <ul data-testid="dataset-summary-filters" class="primary-list">
    <li>query.categoryFilters: {JSON.stringify(query?.categoryFilters)}</li>
    <li>query.numericFilters: {JSON.stringify(query?.numericFilters)}</li>
    <li>query.variantInfoFilters: {JSON.stringify(query?.variantInfoFilters)}</li>
  </ul>
</section>
<section id="detail-variables-container" class="m-3">
  <p class="font-bold text-left my-1">Additional Variables Included in Dataset</p>
  <ul data-testid="dataset-summary-variables" class="primary-list">
    {#each fieldList as [key, fields]}
      <li>
        {key}:
        {#if fields}
          <ul class="ml-4">
            {#each fields as field}
              <li>{field.split('\\').filter(Boolean).join(' > ')}</li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</section>
