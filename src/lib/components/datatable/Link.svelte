<script lang="ts">
  import { browser } from '$app/environment';
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  export let data: any = {};
  function onClick(): void {
    browser && window.open(data.cell, '_blank');
  }
</script>

<button
  type="button"
  title="More Info"
  class="btn variant-ghost-primary hover:variant-filled-primary"
  on:click={onClick}
>
  More Info
</button>
