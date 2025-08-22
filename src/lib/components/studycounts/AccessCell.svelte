<script lang="ts">
  interface Props {
    value: string;
    row: any; // The full row data to access dbgapUrl
  }

  let { value, row }: Props = $props();
</script>

{#if value === 'Public'}
  <span class="btn preset-filled-success-500">Public</span>
{:else}
  <a
    href={row?.dbgapUrl || '#'}
    target="_blank"
    rel="noopener noreferrer"
    class="btn preset-filled-primary-500"
  >
    Request
  </a>
{/if}
