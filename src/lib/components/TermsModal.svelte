<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  // Ideally, this should be a value from the database that has timestamps, author, etc.
  // For now, the easiest place to find and update the html used here is in the src file.
  import Terms from '../../terms.svelte';
</script>

<section id="terms-of-service">
  <Terms />
  <button
    class="btn variant-filled-primary hover:variant-filled-secondary mt-2 float-right"
    on:click={() => modalStore.close()}>Ok</button
  >
</section>
