<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  import QuerySummary from '$lib/components/QuerySummary.svelte';

  $: queryId = $modalStore[0]?.meta.queryId;
  $: query = $modalStore[0]?.meta.query;
</script>

<section id="detail-summary-container" class="m-3">
  <table class="table bg-transparent">
    <tr>
      <td>Dataset ID:</td>
      <td data-testid="dataset-summary-uuid">{queryId}</td>
    </tr>
  </table>
</section>

{#if query}
  <QuerySummary {query} />
{/if}
