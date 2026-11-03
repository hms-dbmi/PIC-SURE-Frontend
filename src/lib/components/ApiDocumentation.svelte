<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwaggerComponent, SwaggerSystem } from 'swagger-ui-dist/swagger-ui-bundle.js';
  import { createLog, log } from '$lib/logger';
  import { createDocsLogging } from '$lib/apiDocsLogging';

  // The first listed service is shown on load: the dictionary, which every visitor can use.
  const services = [
    { name: 'dictionary', title: 'Dictionary' },
    { name: 'hpds-query-service', title: 'Authorized Queries' },
    { name: 'hpds-open-access', title: 'Open Queries' },
  ];
  let available = $state<typeof services>([]);
  let selected = $state('');
  let loading = $state(true);
  let hasRendered = $state(false);
  let error = $state('');
  let host: HTMLDivElement;
  let controller: AbortController | undefined;
  let generation = 0;
  let viewer: SwaggerSystem | undefined;
  let disposeViewer: (() => void) | undefined;
  let shownService = '';
  const docsLogging = createDocsLogging(() => shownService);

  // Swagger's headings nest under the page's "API Documentation" h2: the document title is
  // level 3, its tags level 4 beside the Schemas h4, and the sections of an operation level 5.
  const headingLevels = [
    ['.info .title', '3'],
    ['.opblock-tag', '4'],
    ['.opblock h4', '5'],
  ] as const;

  function setHeadingLevels(root: HTMLElement) {
    for (const [selector, level] of headingLevels) {
      for (const heading of root.querySelectorAll(selector)) {
        if (heading.getAttribute('aria-level') !== level) heading.setAttribute('aria-level', level);
      }
    }
  }

  class DocumentationResponseError extends Error {
    readonly status: number;
    constructor(status: number) {
      super('Documentation request failed');
      this.status = status;
    }
  }

  async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
    const requestController = new AbortController();
    const abort = () => requestController.abort();
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    const timeout = setTimeout(abort, 15000);
    try {
      const response = await fetch(path, {
        signal: requestController.signal,
        credentials: 'omit',
        redirect: 'error',
      });
      if (!response.ok) throw new DocumentationResponseError(response.status);
      return await response.json();
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    }
  }

  function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  async function load(index: boolean) {
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const request = ++generation;
    loading = true;
    error = '';
    let stage = index ? 'registry' : 'document';
    try {
      if (index) {
        const registry = await getJson('/picsure/openapi', signal);
        if (!Array.isArray(registry)) throw new Error('Invalid documentation registry');
        if (request !== generation) return;
        // Only these researcher-facing services belong on this page. Construct local
        // paths ourselves rather than trusting registry URLs or Swagger configuration.
        available = services.filter((service) =>
          registry.some((entry) => isObject(entry) && entry.name === service.name),
        );
        selected = available[0]?.name ?? '';
        if (!selected) {
          error = 'API documentation is unavailable on this deployment.';
          return;
        }
      }
      stage = 'document';
      const document = await getJson(`/picsure/openapi/${selected}`, signal);
      if (
        !isObject(document) ||
        typeof document.openapi !== 'string' ||
        !/^3\.(0|1)\./.test(document.openapi) ||
        !isObject(document.info) ||
        typeof document.info.title !== 'string' ||
        typeof document.info.version !== 'string' ||
        !isObject(document.paths)
      ) {
        throw new Error('Invalid OpenAPI document');
      }
      if (request !== generation) return;
      shownService = selected;
      if (viewer) {
        viewer.specActions.updateSpec(JSON.stringify(document));
        return;
      }
      stage = 'viewer';
      const [{ default: SwaggerUI }] = await Promise.all([
        import('swagger-ui-dist/swagger-ui-bundle.js'),
        import('swagger-ui-dist/swagger-ui.css'),
      ]);
      if (request !== generation) return;
      viewer = SwaggerUI({
        domNode: host,
        spec: document,
        supportedSubmitMethods: [],
        tryItOutEnabled: false,
        deepLinking: false,
        queryConfigEnabled: false,
        persistAuthorization: false,
        docExpansion: 'list',
        // Documents are loaded above. Swagger must not fetch external references,
        // validators, configuration, or execute operations from this read-only viewer.
        requestInterceptor: () => {
          throw new Error('Requests are disabled in this documentation viewer.');
        },
        plugins: [
          () => docsLogging.plugin,
          (system) => {
            const { createElement, useLayoutEffect, useState } = system.React;
            return {
              components: {
                authorizeBtn: () => null,
                authorizeOperationBtn: () => null,
                auths: () => null,
              },
              wrapComponents: {
                App: (Original: SwaggerComponent) =>
                  function EmbeddedApp(props: Record<string, unknown>) {
                    const [visible, setVisible] = useState(true);
                    // The bundle exposes no root.unmount(). Keep one root per page and
                    // unmount its application subtree when Svelte removes the viewer.
                    useLayoutEffect(() => {
                      disposeViewer = () => setVisible(false);
                    }, []);
                    return visible ? createElement(Original, props) : null;
                  },
              },
            };
          },
        ],
      });
      hasRendered = true;
    } catch (cause) {
      if (request !== generation) return;
      const status = cause instanceof DocumentationResponseError ? cause.status : undefined;
      // A deployment without the documentation registry is expected, not a failure.
      const unavailable = stage === 'registry' && status === 404;
      if (!unavailable) {
        log(
          createLog(
            'ERROR',
            'api.docs_load_failed',
            { service: selected || undefined, stage },
            { status, error: { message: cause instanceof Error ? cause.message : String(cause) } },
          ),
        );
      }
      error = unavailable
        ? 'API documentation is unavailable on this deployment.'
        : 'Unable to load API documentation. Please try again.';
    } finally {
      if (request === generation) loading = false;
    }
  }

  function selectService() {
    log(
      createLog('ACTION', 'api.docs_service_select', {
        from: shownService || undefined,
        to: selected,
      }),
    );
    void load(false);
  }

  onMount(() => {
    void load(true);
    const stopTracking = docsLogging.track(host);
    // Swagger renders and replaces its headings as the visitor expands sections.
    const headings = new MutationObserver(() => setHeadingLevels(host));
    headings.observe(host, { childList: true, subtree: true });
    return () => {
      stopTracking();
      headings.disconnect();
      generation++;
      controller?.abort();
      disposeViewer?.();
      disposeViewer = undefined;
      viewer = undefined;
    };
  });
</script>

<div class="api-documentation mt-6" data-testid="api-documentation">
  {#if available.length > 0}
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <label for="api-document-service" class="font-bold">Select service:</label>
      <select
        id="api-document-service"
        class="select w-auto! max-w-full bg-white! py-2!"
        bind:value={selected}
        onchange={selectService}
      >
        {#each available as service (service.name)}
          <option value={service.name}>{service.title}</option>
        {/each}
      </select>
    </div>
  {/if}
  {#if loading}
    <p role="status" class="mx-0">
      Loading API documentation{selected
        ? ` for ${available.find((service) => service.name === selected)?.title}`
        : ''}…
    </p>
  {:else if error}
    <div role="status" class="border border-surface-200 rounded p-4">
      <p class="mx-0">{error}</p>
      <button
        class="btn preset-outlined-primary-500 mt-2"
        onclick={() => void load(available.length === 0)}>Retry</button
      >
    </div>
  {/if}
  <div bind:this={host} class="swagger-host" hidden={!hasRendered || !!error}></div>
</div>

<style>
  .api-documentation {
    min-width: 0;
  }
  .swagger-host {
    background: white;
    color: #3b4151;
    border-radius: 0.5rem;
    overflow-x: auto;
  }
  .swagger-host :global(.swagger-ui .wrapper) {
    padding: 0 12px;
  }
  .swagger-host :global(.swagger-ui .info) {
    margin: 24px 0;
  }
  /* Size Swagger's headings like the page's own headings at the same level (app.css). */
  .swagger-host :global(.swagger-ui .info .title) {
    font-size: 1.5rem;
    line-height: 2rem;
  }
  .swagger-host :global(.swagger-ui .info .title small),
  .swagger-host :global(.swagger-ui .info .title small pre),
  .swagger-host :global(.swagger-ui .info .base-url),
  .swagger-host :global(.swagger-ui .info hgroup.main a) {
    font-size: 1rem;
  }
  .swagger-host :global(.swagger-ui .opblock-tag) {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
  .swagger-host :global(.swagger-ui .scheme-container) {
    padding: 12px;
    box-shadow: none;
  }
  .swagger-host :global(.swagger-ui .opblock-summary-path) {
    overflow-wrap: anywhere;
  }
  .swagger-host :global(.swagger-ui .opblock-summary) {
    flex-wrap: wrap;
  }
</style>
