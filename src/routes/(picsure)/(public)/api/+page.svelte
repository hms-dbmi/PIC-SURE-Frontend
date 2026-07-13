<script lang="ts">
  import { onMount } from 'svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';

  import { branding } from '$lib/configuration';
  import { isUserLoggedIn } from '$lib/stores/User';
  import { log, createLog } from '$lib/logger';

  import UserToken from '$lib/components/UserToken.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import TabItem from '$lib/components/TabItem.svelte';

  const loggedIn = isUserLoggedIn();
  const capabilities = branding.apiPage?.capabilities || [];

  // Logged-in users connect with their personal token (AUTH); anonymous users
  // connect to the OPEN platform with an api key. The open variant is the
  // initial value so it matches the server render (login state is only known
  // client-side); the swap happens after mount. The API tab is placeholder
  // content until its ticket lands.
  const codeBlocks = branding.explorePage.codeBlocks;
  let quickStartCode = $state({
    python: codeBlocks.PythonAPIOpen || 'Code not set',
    r: codeBlocks.RAPIOpen || 'Code not set',
    api: codeBlocks.CurlAPI || 'Code not set',
  });

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

  const tocEntries = [
    { id: 'api-header', label: 'Overview' },
    { id: 'choose-your-workflow', label: 'Choose Your Workflow' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'api-access', label: 'API Access' },
  ];
  let activeSection: string = $state('api-header');

  onMount(() => {
    if (loggedIn) {
      quickStartCode = {
        ...quickStartCode,
        python: codeBlocks.PythonAPI || 'Code not set',
        r: codeBlocks.RAPI || 'Code not set',
      };
    }

    const scroller = document.getElementById('page');
    if (!scroller) return;

    // Deep links like /api#quick-start-python pre-select the language tab. The
    // suffixed ids have no DOM element, so scroll to the section ourselves.
    const deepLink = window.location.hash.match(/^#quick-start-(python|r|api)$/);
    if (deepLink) {
      tabSet = { python: 'Python', r: 'R', api: 'API' }[deepLink[1]] ?? tabSet;
      document.getElementById('quick-start')?.scrollIntoView({ behavior: 'instant' });
    }

    // The TOC marks the last section whose top has crossed into the upper 40% of
    // the scroll viewport. #api-access is too short to ever reach that band, so
    // bottom-of-page counts as viewing it.
    const updateActive = () => {
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
        activeSection = 'api-access';
        return;
      }
      const threshold = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.4;
      let current = tocEntries[0].id;
      for (const { id } of tocEntries) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) current = id;
      }
      activeSection = current;
    };
    updateActive();
    scroller.addEventListener('scroll', updateActive, { passive: true });
    return () => scroller.removeEventListener('scroll', updateActive);
  });

  function quickStart(workflow: Workflow) {
    tabSet = workflow.tab;
    log(createLog('NAVIGATION', 'api.quick_start', { workflow: workflow.id }));
  }

  function tocClick(id: string) {
    activeSection = id;
    log(createLog('NAVIGATION', 'api.toc_click', { section: id }));
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | API</title>
</svelte:head>

<div id="api-page" class="relative w-full pb-6">
  <div
    class="absolute inset-y-0 left-0 w-[13%] hidden xl:block bg-surface-50-950 border-r border-surface-200"
  >
    <nav aria-label="Table of contents" data-testid="toc" class="sticky top-8 pl-6 pr-2">
      <span class="text-sm font-bold">On this page</span>
      <ul class="mt-2 space-y-2 text-sm">
        {#each tocEntries as entry}
          <li>
            <a
              href="#{entry.id}"
              class="hover:underline {activeSection === entry.id
                ? 'font-bold text-primary-500'
                : ''}"
              aria-current={activeSection === entry.id ? 'true' : undefined}
              onclick={() => tocClick(entry.id)}>{entry.label}</a
            >
          </li>
        {/each}
      </ul>
    </nav>
  </div>

  <div class="api-panel flex flex-col">
    <section id="api-header" class="w-full">
      <div class="w-[70%] mx-auto pt-12 pb-10">
        <h1>Programmatic Access with the PIC-SURE API</h1>
        <p class="mx-0">
          Search data and build cohorts directly with Python, R, or any HTTP client. Build
          reproducible cohort-building pipelines.
        </p>
      </div>
    </section>

    <section id="choose-your-workflow" class="w-full flex-1 bg-primary-50-950">
      <div class="w-[70%] mx-auto py-12">
        <h2>Choose Your Workflow</h2>
        <p class="mx-0">Select the access method that fits your project.</p>
        <div class="flex flex-wrap gap-6 mt-4">
          {#each workflows as workflow}
            <div
              data-testid="workflow-card-{workflow.id}"
              class="card border border-surface-200 bg-surface-50-950 p-6 flex flex-col flex-1 basis-64 min-h-96"
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
  </div>

  <section id="authentication" class="api-panel w-full">
    <div class="w-[70%] mx-auto py-12">
      <h2>Authentication</h2>
      <p class="mx-0">
        Your personal access token authenticates all programmatic requests to PIC-SURE.
      </p>
      <div class="flex flex-wrap gap-8 mt-4">
        {#if loggedIn}
          <div class="basis-[60%] grow-0 min-w-0 max-w-full">
            <UserToken />
          </div>
        {:else}
          <!-- TODO: Placeholder for the logged-out authentication state; final design and
               behavior (public access key request) to be defined in an upcoming ticket. -->
          <div
            data-testid="public-access-placeholder"
            class="card border border-surface-200 p-6 basis-[60%] grow-0 min-h-80 flex flex-col"
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
            <button class="btn preset-filled-primary-500 my-auto mx-auto" disabled
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

  <section id="quick-start" class="api-panel w-full bg-primary-50-950">
    <div class="w-[70%] mx-auto py-12">
      <h2>Quick Start</h2>
      <p class="mx-0">Copy and run the example code below to get started.</p>
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
            <CodeBlock lang="python" code={quickStartCode.python} />
          </Tabs.Panel>
          <Tabs.Panel value="R">
            <CodeBlock lang="r" code={quickStartCode.r} />
          </Tabs.Panel>
          <Tabs.Panel value="API">
            <CodeBlock lang="bash" code={quickStartCode.api} />
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

<style>
  /* 100cqh = the height of the #page scroll viewport (a size container; see
     app.css). 100vh would overshoot because the nav bar sits outside it. */
  .api-panel {
    min-height: 100cqh;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(#page) {
      scroll-behavior: smooth;
    }
  }
</style>
