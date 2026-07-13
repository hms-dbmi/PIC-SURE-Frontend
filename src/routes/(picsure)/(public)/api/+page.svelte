<script lang="ts">
  import { Tabs } from '@skeletonlabs/skeleton-svelte';

  import { branding } from '$lib/configuration';
  import { isUserLoggedIn } from '$lib/stores/User';
  import { log, createLog } from '$lib/logger';

  import UserToken from '$lib/components/UserToken.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import TabItem from '$lib/components/TabItem.svelte';

  const loggedIn = isUserLoggedIn();
  const capabilities = branding.apiPage?.capabilities || [];

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

  let tabSet: string = $state('Python');

  function quickStart(workflow: Workflow) {
    tabSet = workflow.tab;
    log(createLog('NAVIGATION', 'api.quick_start', { workflow: workflow.id }));
  }
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
              onclick={() => quickStart(workflow)}>Quick Start</a
            >
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section id="authentication" class="w-full">
    <div class="w-[70%] mx-auto py-8">
      <h2>Authentication</h2>
      <p class="mx-0">
        Your personal access token authenticates all programmatic requests to PIC-SURE.
      </p>
      <div class="flex flex-wrap gap-8 mt-4">
        {#if loggedIn}
          <div class="card border border-surface-200 p-6 w-fit max-w-full overflow-x-auto">
            <header class="flex items-center gap-4 mb-4">
              <i class="fa-solid fa-user-shield text-3xl text-success-500"></i>
              <div>
                <div class="text-lg font-bold">Personal Access Token</div>
                <div class="text-sm">Login confirmed</div>
              </div>
            </header>
            <UserToken />
          </div>
        {:else}
          <!-- TODO: Placeholder for the logged-out authentication state; final design and
               behavior (public access key request) to be defined in an upcoming ticket. -->
          <div
            data-testid="public-access-placeholder"
            class="card border border-surface-200 p-6 max-w-xl flex flex-col"
          >
            <header class="flex items-center gap-4 mb-4">
              <i class="fa-solid fa-globe text-3xl text-primary-500"></i>
              <div>
                <div class="text-lg font-bold">Public Access Key</div>
                <div class="text-sm">No account required</div>
              </div>
            </header>
            <p class="mx-0">
              A public key grants access to open resources, including aggregate counts for
              feasibility assessments.
            </p>
            <button class="btn preset-filled-primary-500 mt-6 mx-auto" disabled
              >Request Public Key</button
            >
          </div>
        {/if}
        <div id="capabilities" class="flex-1 min-w-64">
          <h3 class="text-lg font-bold mb-3">What you can do</h3>
          <ul class="space-y-3">
            {#each capabilities as capability}
              {@const locked = !loggedIn && capability.requiresLogin}
              <li data-testid="capability-item" class="flex items-center gap-3">
                {#if locked}
                  <i class="fa-regular fa-circle-xmark text-xl text-surface-400"></i>
                {:else}
                  <i class="fa-regular fa-circle-check text-xl text-success-500"></i>
                {/if}
                <span class={locked ? 'text-surface-500' : ''}>
                  {capability.text}{#if capability.requiresLogin}&nbsp;(Requires login){/if}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section id="quick-start" class="w-full bg-primary-50-950">
    <div class="w-[70%] mx-auto py-8">
      <h2>Quick Start</h2>
      <p class="mx-0">Copy and run the example code to get started.</p>
      <Tabs
        value={tabSet}
        onValueChange={(e) => {
          tabSet = e.value;
          log(createLog('ACTION', 'api.tab_change', { tab: e.value }));
        }}
      >
        {#snippet list()}
          <TabItem bind:group={tabSet} value="Python">Python</TabItem>
          <TabItem bind:group={tabSet} value="R">R</TabItem>
          <TabItem bind:group={tabSet} value="API">API</TabItem>
        {/snippet}
        {#snippet content()}
          <Tabs.Panel value="Python">
            <CodeBlock
              lang="python"
              code={branding.explorePage.codeBlocks.PythonAPI || 'Code not set'}
            />
          </Tabs.Panel>
          <Tabs.Panel value="R">
            <CodeBlock lang="r" code={branding.explorePage.codeBlocks.RAPI || 'Code not set'} />
          </Tabs.Panel>
          <Tabs.Panel value="API">
            <CodeBlock
              lang="console"
              code={branding.explorePage.codeBlocks.CurlAPI || 'Code not set'}
            />
          </Tabs.Panel>
        {/snippet}
      </Tabs>
    </div>
  </section>

  <section id="api-access" class="w-full">
    <div class="w-[70%] mx-auto py-8">
      <h2>API Access</h2>
      <!-- TODO: Section content (endpoint browser / documentation links) to be defined in an
           upcoming ticket. -->
      <p class="mx-0">Browse and use the PIC-SURE API endpoints.</p>
    </div>
  </section>
</div>
