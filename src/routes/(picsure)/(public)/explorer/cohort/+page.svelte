<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { branding } from '$lib/configuration';
  import { countResult } from '$lib/utilities/PatientCount';
  import { StatPromise, getStatFields } from '$lib/utilities/StatBuilder';

  import type { PatientCount, StatResult, StatValue } from '$lib/models/Stat';
  import { resultCounts } from '$lib/stores/ResultStore';
  import { panelOpen } from '$lib/stores/SidePanel';
  import { getQueryResources } from '$lib/stores/Resources';
  import { loading as resourcesPromise } from '$lib/stores/Resources';

  import Content from '$lib/components/Content.svelte';
  import Loading from '$lib/components/Loading.svelte';

  interface RowType {
    style: string;
    values: (string | Promise<StatValue>)[];
  }

  interface ColumnType {
    style: string;
    value: string;
  }

  const NO_DATA = '-';

  const styles = {
    center: '!text-center',
    left: '!text-left',
    stat: 'font-bold',
    field: '',
  };

  let resources: string[] = $state([]);
  let columns: ColumnType[] = $derived([
    { style: styles.left, value: 'Details' },
    { style: styles.center, value: 'Total' },
    ...resources.map((value) => ({ style: styles.center, value })),
  ]);
  let rows: RowType[] = $derived(
    resources.length > 0 ? setTableData($resultCounts, resources) : [],
  );

  function setTableData(stats: StatResult[], resourceNames: string[]) {
    let rows: RowType[] = [];

    stats.forEach((stat: StatResult) => {
      const statTotal: Promise<StatValue> = Promise.allSettled(
        StatPromise.list(stat).map(({ promise }) => promise),
      ).then((results: PromiseSettledResult<StatValue>[]) =>
        countResult(results.map(StatPromise.valueOrZero)),
      );
      const resourceTotals: Promise<StatValue>[] = resourceNames.map((resource) =>
        stat.result[resource].then((count) => countResult([count])),
      );

      rows.push({ style: styles.stat, values: [stat.label, statTotal, ...resourceTotals] });

      getStatFields(stat.key).forEach((field) => {
        const fieldCount = (stat: StatValue): PatientCount => {
          const count = typeof stat === 'object' ? stat[field.conceptPath] || NO_DATA : stat;
          return `${count}` === '-1' ? NO_DATA : count;
        };

        const fieldTotal: Promise<StatValue> = Promise.allSettled(
          StatPromise.list(stat).map(({ promise }) => promise),
        ).then((results: PromiseSettledResult<StatValue>[]) =>
          countResult(results.map(StatPromise.valueOrZero).map(fieldCount)),
        );
        const fieldTotals: Promise<StatValue>[] = resourceNames.map((resource) =>
          stat.result[resource].then(fieldCount),
        );

        rows.push({ style: styles.field, values: [field.label, fieldTotal, ...fieldTotals] });
      });
    });
    return rows;
  }

  onMount(async () => {
    await $resourcesPromise;
    resources = getQueryResources().map(({ name }) => name);
    $panelOpen = false;
  });

  onDestroy(() => {
    $panelOpen = true;
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Cohort Details</title>
</svelte:head>

<Content full backUrl="/explorer" backTitle="Back to Cohort Builder" title="Cohort Details">
  <p class="text-center">
    {branding.results.cohortDescription ||
      'Distribution of total patient counts across networked institutions.'}
  </p>
  {#await $resourcesPromise}
    <Loading ring size="large" />
  {:then}
    <ul id="cohort-key" class="w-full flex text-center py-3">
      <li class="flex-auto">"0" = Site returned zero results</li>
      <li class="flex-auto">"-" = No data for that site</li>
      <li class="flex-auto">
        <i class="fa-solid fa-circle-xmark text-error-500"></i> = Site did not return results
      </li>
    </ul>
    <div class="table-wrap">
      <table class="table caption-bottom">
        <thead>
          <tr>
            {#each columns as column}
              <th class={column.style}>{column.value}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr>
              {#each row.values as rowColumn, index}
                <td class="{columns[index].style} {row.style}">
                  {#await rowColumn}
                    <Loading ring size="micro" />
                  {:then rowValue}
                    {rowValue}
                  {:catch}
                    <i class="fa-solid fa-circle-xmark text-error-500 w-full text-center"></i>
                  {/await}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/await}
</Content>
