<script lang="ts">
  // TODO: use query type instead of any

  interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query?: any;
  }

  let { query = {} }: Props = $props();
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
    <li>query.requiredFields: {JSON.stringify(query?.requiredFields)}</li>
    <li>query.anyRecordOf: {JSON.stringify(query?.anyRecordOf)}</li>
    <li>query.anyRecordOfMulti: {JSON.stringify(query?.anyRecordOfMulti)}</li>
    <li>query.crossCountFields: {JSON.stringify(query?.crossCountFields)}</li>
  </ul>
</section>
