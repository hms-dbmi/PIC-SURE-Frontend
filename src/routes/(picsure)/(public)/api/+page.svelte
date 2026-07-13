<script lang="ts">
  import { branding } from '$lib/configuration';
  import { log, createLog } from '$lib/logger';

  interface Workflow {
    id: string;
    title: string;
    badge: string;
    badgeClass: string;
    bullets: string[];
    tab: string;
  }

  const workflows: Workflow[] = [
    {
      id: 'python',
      title: 'Python Client',
      badge: 'Recommended',
      badgeClass: 'preset-filled-primary-500',
      bullets: ['Requires Python version 3.10.20 or later', 'Python Jupyter Notebooks'],
      tab: 'Python',
    },
    {
      id: 'r',
      title: 'R Client',
      badge: 'Recommended',
      badgeClass: 'preset-filled-primary-500',
      bullets: ['Requires R version 4.1 or later', 'R Jupyter Notebooks or RStudio'],
      tab: 'R',
    },
    {
      id: 'http',
      title: 'Direct API Access',
      badge: 'Advanced',
      badgeClass: 'preset-filled-warning-500',
      bullets: ['Interact directly with PIC-SURE API endpoints'],
      tab: 'API',
    },
  ];
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

  <section id="choose-your-workflow" class="w-full bg-primary-50-950">
    <div class="w-[70%] mx-auto py-8">
      <h2>Choose Your Workflow</h2>
      <p class="mx-0">Select the access method that fits your project.</p>
      <div class="flex flex-wrap gap-6 mt-4">
        {#each workflows as workflow}
          <div
            data-testid="workflow-card-{workflow.id}"
            class="card border border-surface-200 bg-surface-50-950 p-6 flex flex-col flex-1 basis-64 min-h-64"
          >
            <header class="flex items-center justify-between gap-2">
              <h3 class="text-xl font-bold">{workflow.title}</h3>
              <span class="badge {workflow.badgeClass}">{workflow.badge}</span>
            </header>
            <ul class="list-inside list-disc space-y-2 my-4">
              {#each workflow.bullets as bullet}
                <li>{bullet}</li>
              {/each}
            </ul>
            <a
              href="#quick-start"
              class="btn preset-filled-primary-500 mt-auto"
              onclick={() =>
                log(createLog('NAVIGATION', 'api.quick_start', { workflow: workflow.id }))}
              >Quick Start</a
            >
          </div>
        {/each}
      </div>
    </div>
  </section>
</div>
