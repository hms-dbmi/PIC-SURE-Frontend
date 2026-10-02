<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';

  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { config, PROJECT_HOSTNAME } from '$lib/configuration.svelte';
  import { getApiConnectionResource } from '$lib/stores/Resources';
  import { hasValidToken, tokenStatus } from '$lib/stores/User';
  import { log, createLog } from '$lib/logger';

  import ApiDocumentation from '$lib/components/ApiDocumentation.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import PublicAccessKey from '$lib/components/PublicAccessKey.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';

  let mounted = $state(false);
  let loggedIn = $derived(mounted && $tokenStatus);

  // Release 1: the load redirect only runs on navigation, so also leave when the
  // session ends while the page is open (logout in another tab, token expiry).
  $effect(() => {
    if (mounted && !$hasValidToken) void goto(resolve('/'));
  });
  const capabilities = config.branding.apiPage?.capabilities || [];

  const codeBlocks = $derived(config.branding.explorePage.codeBlocks);

  function apiExample(code: string | undefined) {
    return (code || 'Code not set').replace(PROJECT_HOSTNAME, `${page.url.origin}/picsure`);
  }
  type ApiLanguage = 'python' | 'r';

  function booleanLiteral(value: boolean, language: ApiLanguage) {
    if (language === 'python') return value ? 'True' : 'False';
    return value ? 'TRUE' : 'FALSE';
  }

  interface ApiCodeBlockValues {
    includeConsents: boolean;
    requiresAuth: boolean;
    supportsGenomic: boolean;
  }

  function renderApiCodeBlock(
    code: string | undefined,
    language: ApiLanguage,
    values: ApiCodeBlockValues,
  ) {
    return apiExample(code)
      .replace('{{INCLUDE_CONSENTS}}', booleanLiteral(values.includeConsents, language))
      .replace('{{REQUIRES_AUTH}}', booleanLiteral(values.requiresAuth, language))
      .replace('{{SUPPORTS_GENOMIC}}', booleanLiteral(values.supportsGenomic, language));
  }

  function getClientCode(authenticated: boolean) {
    const connection = getApiConnectionResource(authenticated);
    const values: ApiCodeBlockValues = {
      // consents are no longer an opt-in feature flag: PSAMA returns them for every
      // authenticated user, so the authorized example always includes them
      includeConsents: connection.requiresAuth,
      requiresAuth: connection.requiresAuth,
      supportsGenomic:
        Boolean(config.features.enableGENEQuery || config.features.enableSNPQuery) &&
        !connection.usesDistinctOpenResource,
    };
    const pythonTemplate = connection.requiresAuth
      ? codeBlocks.PythonAPI
      : codeBlocks.PythonAPIOpen;
    const rTemplate = connection.requiresAuth ? codeBlocks.RAPI : codeBlocks.RAPIOpen;

    return {
      python: renderApiCodeBlock(pythonTemplate, 'python', values),
      r: renderApiCodeBlock(rTemplate, 'r', values),
    };
  }

  let clientCode = $derived(getClientCode(loggedIn));

  interface Workflow {
    id: ApiLanguage;
    title: string;
    audience: string;
    requirements: string;
    docsLabel: string;
    docsUrl: string;
  }

  const workflows: Workflow[] = [
    {
      id: 'python',
      title: 'Python Client',
      audience: 'Best if you work in Python or Jupyter Notebooks.',
      requirements: 'Python 3.10+',
      docsLabel: 'Python client documentation',
      docsUrl: 'https://github.com/hms-dbmi/pic-sure-python-adapter-hpds',
    },
    {
      id: 'r',
      title: 'R Client',
      audience: 'Best if you work in R, Jupyter Notebooks, or RStudio.',
      requirements: 'R 4.1+',
      docsLabel: 'R client documentation',
      docsUrl: 'https://github.com/hms-dbmi/pic-sure-r-adapter-hpds',
    },
  ];

  let openWorkflows: string[] = $state([]);

  const tocEntries = [
    { id: 'api-header', label: 'Overview' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'choose-your-workflow', label: 'Choose Your Workflow' },
  ];
  let activeSection: string = $state('api-header');

  onMount(() => {
    mounted = true;

    const scroller = document.getElementById('page');
    if (!scroller) return;

    // Deep links like /api#workflow-python open that client's item.
    const deepLink = window.location.hash.match(/^#workflow-(python|r)$/);
    // The item's panel slides open and the token card in Authentication loads after
    // the first scroll, so the item moves and the page grows; re-align until the
    // visitor takes over.
    const deepLinkTarget = () => document.getElementById(`workflow-${deepLink?.[1]}`);
    const alignDeepLink = () => deepLinkTarget()?.scrollIntoView({ behavior: 'instant' });
    const pin = new ResizeObserver(alignDeepLink);
    const unpinEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;
    let pinned = true;
    const unpin = () => {
      pinned = false;
      pin.disconnect();
      for (const type of unpinEvents) window.removeEventListener(type, unpin, true);
    };
    if (deepLink) {
      openWorkflows = [deepLink[1]];
      for (const type of unpinEvents) window.addEventListener(type, unpin, true);
      // Opening the item changes the layout; align only after Svelte renders it.
      void tick().then(() => {
        alignDeepLink();
        if (!pinned) return;
        for (const el of [document.getElementById('authentication'), deepLinkTarget()]) {
          if (el) pin.observe(el);
        }
      });
    }

    // The page ends override the 40% threshold: Authentication already crosses it
    // on load, and the last section may never reach it.
    const updateActive = () => {
      if (scroller.scrollTop <= 4) {
        activeSection = tocEntries[0].id;
        return;
      }
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
        activeSection = tocEntries[tocEntries.length - 1].id;
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
    return () => {
      scroller.removeEventListener('scroll', updateActive);
      unpin();
    };
  });

  async function navigateSection(event: MouseEvent, id: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    await goto(resolve(`/api#${id}`), { noScroll: true, keepFocus: true });
    document.getElementById(id)?.scrollIntoView();
  }

  function toggleWorkflow(value: string[]) {
    openWorkflows = value;
    log(createLog('ACTION', 'api.workflow_toggle', { open: value[0] ?? null }));
  }

  function tocClick(event: MouseEvent, id: string) {
    void navigateSection(event, id);
    activeSection = id;
    log(createLog('NAVIGATION', 'api.toc_click', { section: id }));
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | API</title>
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
              onclick={(event) => tocClick(event, entry.id)}>{entry.label}</a
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
        <!-- Release 1: direct API access is hidden. -->
        {#if false}
          <p class="mx-0">
            Search data and build cohorts directly with Python, R, or any HTTP client. Build
            reproducible cohort-building pipelines.
          </p>
        {:else}
          <p class="mx-0">
            Search data and build cohorts directly with Python or R. Build reproducible
            cohort-building pipelines.
          </p>
        {/if}
      </div>
    </section>

    <section id="authentication" class="w-full flex-1">
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
            <div class="basis-[60%] grow-0 min-w-0 max-w-full">
              <PublicAccessKey enabled={config.branding.apiPage?.publicKeyEnabled ?? false} />
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
            {#if !loggedIn}
              <hr class="my-4 border-surface-200" />
              <p class="mx-0">
                Looking for authorized access?
                <a
                  class="anchor"
                  href="{resolve('/login')}?redirectTo=/api"
                  data-testid="api-login-link">Login</a
                >
              </p>
            {/if}
          </div>
        </div>
      </div>
    </section>
  </div>

  <section id="choose-your-workflow" class="api-panel w-full bg-primary-50-950">
    <div class="w-[70%] mx-auto py-12">
      <h2>Choose Your Workflow</h2>
      <p class="mx-0">Select the access method that fits your project.</p>
      <Accordion
        value={openWorkflows}
        onValueChange={(e) => toggleWorkflow(e.value)}
        collapsible
        spaceY="space-y-4"
        classes="mt-4"
      >
        {#snippet iconOpen()}<i class="fa-solid fa-angle-up text-xl"></i>{/snippet}
        {#snippet iconClosed()}<i class="fa-solid fa-angle-down text-xl"></i>{/snippet}
        {#each workflows as workflow}
          <div id="workflow-{workflow.id}" data-testid="workflow-{workflow.id}">
            <Accordion.Item
              value={workflow.id}
              base="rounded-container border border-surface-200 bg-surface-50-950 data-[state=open]:border-primary-500"
              controlHover="hover:bg-surface-100-900"
              controlPadding="p-6"
              controlRounded="rounded-container"
              panelPadding="px-6 pb-6"
            >
              {#snippet control()}
                <span class="block text-xl font-bold">{workflow.title}</span>
                <span class="block mt-1 text-base">{workflow.audience}</span>
                <span class="block mt-1 text-sm font-mono text-surface-600-400">
                  {workflow.requirements}
                </span>
              {/snippet}
              {#snippet panel()}
                <p class="mx-0 mb-4 p-4 rounded-base preset-tonal-primary">
                  Copy your token above, paste it into a file named <code class="code"
                    >token.txt</code
                  >, and save it in the same folder as your notebook. Don't share this file or
                  commit it to GitHub.
                </p>
                <CodeBlock lang={workflow.id} code={clientCode[workflow.id]} />
                <p
                  class="mx-0 mt-6 mb-1 text-sm font-bold uppercase tracking-wide text-surface-600-400"
                >
                  More info
                </p>
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external docs URL -->
                <a class="anchor" href={workflow.docsUrl} target="_blank" rel="noopener noreferrer"
                  >{workflow.docsLabel}</a
                >
                <p class="mx-0 mt-2">
                  Looking for example notebooks? Find PIC-SURE tutorials in your Seven Bridges or
                  Terra workspace.
                </p>
              {/snippet}
            </Accordion.Item>
          </div>
        {/each}
      </Accordion>
    </div>
  </section>

  <!-- Release 1: the API Access section is hidden. -->
  {#if false}
    <section id="api-access" class="w-full">
      <div class="w-[70%] mx-auto py-8">
        <h2>API Access</h2>
        <p class="mx-0">Browse and use the PIC-SURE API endpoints.</p>
        {#if mounted && !loggedIn}
          <div
            class="flex gap-4 items-start border border-primary-500 rounded-lg bg-primary-50-950 p-4 mt-6"
            data-testid="api-public-notice"
          >
            <i class="fa-solid fa-globe text-3xl text-primary-500" aria-hidden="true"></i>
            <div>
              <h3 class="font-bold text-primary-500">Public Access Only</h3>
              <p class="mx-0">
                You are browsing as a public user. Only open API endpoints are available. To use
                authorized resources, please <a
                  class="anchor"
                  href="{resolve('/login')}?redirectTo=/api">log in</a
                >.
              </p>
            </div>
          </div>
        {/if}
        <ApiDocumentation />
      </div>
    </section>
  {/if}
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
