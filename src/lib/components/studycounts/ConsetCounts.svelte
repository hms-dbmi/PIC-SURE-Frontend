<script lang="ts">
  interface Props {
    data: {
      cell?:
        | Map<string, Map<string, string>>
        | {
            [consentCode: string]: string | number;
          }
        | undefined;
    };
  }

  let { data }: Props = $props();
  const LESS_THAN_10 = '< 10';
  const entries = $derived(data.cell ? Object.entries(data.cell) : []);
  const singleEntry = $derived(entries.length === 1 && entries[0][0] === '-1');
  const namedEntries = $derived(entries.filter(([code]) => code !== '-1'));
</script>

<div class="table-wrap">
  <table class="table-reset w-full">
    <tbody class="p-0 m-0">
      {#if data.cell}
        {#if singleEntry}
          <tr class="p-0 m-0 !bg-transparent">
            <td class="p-0 m-0 pl-4 text-end">{entries[0][1]}</td>
          </tr>
        {:else}
          {#each namedEntries as [consentCode, count]}
            <tr class="p-0 m-0 !bg-transparent">
              <td class="p-0 m-0">{consentCode}</td>
              <td class="p-0 pl-4 text-end">{count}</td>
            </tr>
          {/each}
        {/if}
      {:else}
        <tr class="p-0 m-0 !bg-transparent">
          <td class="p-0 m-0 pl-4 text-end">{LESS_THAN_10}</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-reset,
  .table-reset *,
  .table-reset *::before,
  .table-reset *::after {
    all: revert;
  }
</style>
