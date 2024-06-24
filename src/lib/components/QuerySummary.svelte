<script lang="ts">
  // TODO: use query type instead of any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let query: any = {};
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
    <li>query.fields: {JSON.stringify(query?.fields)}</li>
  </ul>
</section>
