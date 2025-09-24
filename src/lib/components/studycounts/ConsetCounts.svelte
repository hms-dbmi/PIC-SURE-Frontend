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
</script>

<div class="table-wrap">
  <table class="table-reset">
    <tbody class="p-0 m-0">
      {#if data.cell}
        {#each Object.entries(data.cell) as [consentCode, count]}
          <tr class="p-0 m-0">
            <td class="p-0 m-0">
              {#if consentCode !== '-1'}
                {consentCode}
              {/if}
            </td>
            <td class="p-0 m-0">{count}</td>
          </tr>
        {/each}
      {:else}
        <tr class="p-0 m-0">
          <td class="p-0 m-0">{LESS_THAN_10}</td>
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
