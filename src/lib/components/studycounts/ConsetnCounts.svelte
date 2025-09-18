<script lang="ts">
  interface Props {
    counts: {
    [consentCode: string]: string | number;
} | undefined;
  }

  let { counts }: Props = $props();
  const LESS_THAN_10 = '< 10';
</script>

<div class="table-wrap">
  <table class="table table-auto">
    <tbody>
      {#if counts}
        {#each Object.entries(counts) as [consentCode, count]}
          <tr>
            <td>
              {#if consentCode !== '-1'}
                {consentCode}
              {/if}
            </td>
            <td>{count}</td>
          </tr>
        {/each}
      {:else}
        <tr>
          <td>{LESS_THAN_10}</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>