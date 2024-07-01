<script lang="ts">
    import AngleButton from "$lib/components/buttons/AngleButton.svelte";
    import ExportStepper from "$lib/components/explorer/export/ExportStepper.svelte";
import { AppBar } from "@skeletonlabs/skeleton";

export let query: any;

</script>


<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
  <svelte:fragment slot="lead">
    <AngleButton angle="left" variant="ringed" color="primary" name="Back" on:click={() => history.back()}>Back to Cohort Builder</AngleButton>
  </svelte:fragment>
	Export Data for Research Analysis
</AppBar>
<section class="flex justify-center items-center w-full h-full mt-8">
  <ExportStepper {query}  />
</section>

<style>
</style>