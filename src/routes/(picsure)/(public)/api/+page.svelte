<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';

  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { config, PROJECT_HOSTNAME } from '#lib/configuration.svelte.ts';
  import { getApiConnectionResource } from '#lib/stores/Resources.ts';
  import { tokenStatus } from '#lib/stores/User.ts';
  import { log, createLog } from '#lib/logger.ts';

  import ApiDocumentation from '#lib/components/ApiDocumentation.svelte';
  import UserToken from '#lib/components/UserToken.svelte';
  import PublicAccessKey from '#lib/components/PublicAccessKey.svelte';
  import CodeBlock from '#lib/components/CodeBlock.svelte';
  import TocLayout from '#lib/components/toc/TocLayout.svelte';
  import TocSection from '#lib/components/toc/TocSection.svelte';

  let mounted = $state(false);
  let loggedIn = $derived(mounted && $tokenStatus);
  const capabilities = config.branding.apiPage?.capabilities || [];

  const codeBlocks = $derived(config.branding.explorePage.codeBlocks);

  function apiExample(code: string | undefined) {
    return (code || 'Code not set')
      .replaceAll(PROJECT_HOSTNAME, `${page.url.origin}/picsure`)
      .replaceAll(PROJECT_HOSTNAME.replace(/\/picsure$/, ''), page.url.origin);
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
      http: apiExample(codeBlocks.CurlAPI),
    };
  }

  let clientCode = $derived(getClientCode(loggedIn));

  interface Workflow {
    id: 'python' | 'r' | 'http';
    title: string;
    audience: string;
    requirements: string;
    lang: 'python' | 'r' | 'bash';
    tokenLocation: string;
    docsLabel: string;
    // An external docs URL, or the id of a section on this page.
    docsUrl?: string;
    docsSection?: string;
  }

  const workflows: Workflow[] = [
    {
      id: 'python',
      title: 'Python Client',
      audience: 'Best if you work in Python or Jupyter Notebooks.',
      requirements: 'Python 3.10+',
      lang: 'python',
      tokenLocation: 'in the same folder as your code',
      docsLabel: 'Python client documentation',
      docsUrl: 'https://github.com/hms-dbmi/pic-sure-python-adapter-hpds',
    },
    {
      id: 'r',
      title: 'R Client',
      audience: 'Best if you work in R, Jupyter Notebooks, or RStudio.',
      requirements: 'R 4.1+',
      lang: 'r',
      tokenLocation: 'in the same folder as your code',
      docsLabel: 'R client documentation',
      docsUrl: 'https://github.com/hms-dbmi/pic-sure-r-adapter-hpds',
    },
    {
      id: 'http',
      title: 'Direct API Access',
      audience: 'Best if you call PIC-SURE endpoints from a custom HTTP client.',
      requirements: 'Any HTTP client',
      lang: 'bash',
      tokenLocation: 'in your working directory',
      docsLabel: 'API reference',
      docsSection: 'api-access',
    },
  ];

  let openWorkflows: string[] = $state([]);

  const tocEntries = [
    { id: 'authentication', label: 'Authentication' },
    { id: 'choose-your-workflow', label: 'Choose Your Workflow' },
    { id: 'api-access', label: 'API Documentation' },
  ];

  onMount(() => {
    mounted = true;

    const deepLink = window.location.hash.match(/^#workflow-(python|r|http)$/);
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
      void tick().then(() => {
        alignDeepLink();
        if (!pinned) return;
        for (const el of [document.getElementById('authentication'), deepLinkTarget()]) {
          if (el) pin.observe(el);
        }
      });
    }

    return unpin;
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
    await goto(resolve(`api#${id}`), { reset: false });
    document.getElementById(id)?.scrollIntoView();
  }

  function toggleWorkflow(value: string[]) {
    openWorkflows = value;
    log(createLog('ACTION', 'api.workflow_toggle', { open: value[0] ?? null }));
  }

  function tocClick(id: string) {
    log(createLog('NAVIGATION', 'api.toc_click', { section: id }));
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | API</title>
</svelte:head>

<div id="api-page" class="w-full pb-6">
  <TocLayout entries={tocEntries} onselect={tocClick}>
    {#snippet hero()}
      <h1 id="api-header">Programmatic Access with the PIC-SURE API</h1>
      <p class="mx-0 max-w-3xl text-lg">
        Search data and build cohorts directly with Python, R, or any HTTP client. Build
        reproducible cohort-building pipelines.
      </p>
    {/snippet}
    <TocSection id="authentication">
      <h2>Authentication</h2>
      <p class="mx-0">
        Your personal access token authenticates all programmatic requests to PIC-SURE.
      </p>
      <div class="flex flex-wrap gap-8 mt-4">
        {#if loggedIn}
          <div class="flex-1 basis-96 min-w-0 max-w-full">
            <UserToken />
          </div>
        {:else}
          <div class="flex-1 basis-96 min-w-0 max-w-full">
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
                href="{resolve('login')}?redirectTo=/api"
                data-testid="api-login-link">Login</a
              >
            </p>
          {/if}
        </div>
      </div>
    </TocSection>

    <TocSection id="choose-your-workflow" tinted>
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
              base="rounded-container border border-surface-200 bg-white dark:bg-surface-950 data-[state=open]:border-primary-500"
              controlHover="hover:bg-surface-100-900"
              controlPadding="p-6"
              controlRounded="rounded-container"
              panelPadding="px-6 pb-6"
            >
              {#snippet control()}
                <span class="flex flex-wrap items-center gap-3">
                  <span class="text-xl font-bold">{workflow.title}</span>
                  <span
                    class="badge shrink-0 {workflow.id === 'http'
                      ? 'preset-tonal-warning'
                      : 'preset-tonal-primary'}"
                  >
                    {workflow.id === 'http' ? 'Advanced' : 'Recommended'}
                  </span>
                </span>
                <span class="block mt-1 text-base">{workflow.audience}</span>
                <span class="block mt-1 text-sm font-mono text-surface-600-400">
                  {workflow.requirements}
                </span>
              {/snippet}
              {#snippet panel()}
                <p class="mx-0 mb-4 p-4 rounded-base preset-tonal-primary">
                  Copy your token above, paste it into a file named <code class="code"
                    >token.txt</code
                  >, and save it {workflow.tokenLocation}. Don't share this file or commit it to
                  GitHub.
                </p>
                <CodeBlock lang={workflow.lang} code={clientCode[workflow.id]} />
                <p
                  class="mx-0 mt-6 mb-1 text-sm font-bold uppercase tracking-wide text-surface-600-400"
                >
                  More info
                </p>
                {#if workflow.docsSection}
                  {@const section = workflow.docsSection}
                  <a
                    class="anchor"
                    href={resolve(`api#${section}`)}
                    onclick={(event) => void navigateSection(event, section)}
                    >{workflow.docsLabel}</a
                  >
                {:else}
                  <!-- eslint-disable svelte/no-navigation-without-resolve -- external docs URL -->
                  <a
                    class="anchor"
                    href={workflow.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer">{workflow.docsLabel}</a
                  >
                  <!-- eslint-enable svelte/no-navigation-without-resolve -->
                  <p class="mx-0 mt-2">
                    Looking for example notebooks? Check out the
                    <a
                      class="anchor"
                      href="https://github.com/hms-dbmi/Access-to-Data-using-PIC-SURE-API"
                      target="_blank"
                      rel="noopener noreferrer">public GitHub repository</a
                    >.
                  </p>
                {/if}
              {/snippet}
            </Accordion.Item>
          </div>
        {/each}
      </Accordion>
    </TocSection>

    <TocSection id="api-access">
      <h2>API Documentation</h2>
      <p class="mx-0">Browse and use the PIC-SURE API endpoints.</p>
      {#if mounted && !loggedIn}
        <div
          class="flex gap-4 items-start border border-primary-500 rounded-lg bg-white p-4 mt-6"
          data-testid="api-public-notice"
        >
          <i class="fa-solid fa-globe text-3xl text-primary-500" aria-hidden="true"></i>
          <div>
            <h3 class="font-bold text-primary-500">Public Access Only</h3>
            <p class="mx-0">
              You are browsing as a public user. Only open API endpoints are available. To use
              authorized resources, please <a
                class="anchor"
                href="{resolve('login')}?redirectTo=/api">log in</a
              >.
            </p>
          </div>
        </div>
      {/if}
      <ApiDocumentation />
    </TocSection>
  </TocLayout>
</div>

<style>
  @media (prefers-reduced-motion: no-preference) {
    :global(#page) {
      scroll-behavior: smooth;
    }
  }
</style>
