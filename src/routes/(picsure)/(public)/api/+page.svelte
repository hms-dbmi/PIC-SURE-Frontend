<script lang="ts">
  import { branding } from '$lib/configuration';
</script>

<svelte:head>
  <title>{branding.applicationName} | API</title>
</svelte:head>

<div id="api-page" class="w-full pb-6">
  <section id="api-header" class="w-full">
    <div class="w-[70%] mx-auto pt-8 pb-6">
      <h1>Programmatic Access with the PIC-SURE API</h1>
      <p class="mx-0">
        Search data and build cohorts directly with Python, R, or any HTTP client. Build
        reproducible cohort-building pipelines.
      </p>
    </div>
  </section>
</div>
