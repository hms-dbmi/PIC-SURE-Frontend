<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwaggerComponent, SwaggerSystem } from 'swagger-ui-dist/swagger-ui-bundle.js';
  import { ApiError } from '#lib/api/errors.ts';
  import { getDocumentedServices, getOpenApiDocument } from '#lib/api/picsure/openapi.ts';
  import Button from '#lib/ui/Button.svelte';
  import { createLog, log } from '#lib/telemetry/logger.ts';
  import { createDocsLogging } from './apiDocsLogging.ts';

  const services = [
    { name: 'hpds-query-service', title: 'HPDS queries' },
    { name: 'dictionary', title: 'Dictionary' },
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
        const documented = await getDocumentedServices(signal);
        if (request !== generation) return;
        // Only these researcher-facing services belong on this page. Construct local
        // paths ourselves rather than trusting registry URLs or Swagger configuration.
        available = services.filter((service) => documented.includes(service.name));
        selected = available[0]?.name ?? '';
        if (!selected) {
          error = 'API documentation is unavailable on this deployment.';
          return;
        }
      }
      stage = 'document';
      const document = await getOpenApiDocument(selected, signal);
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
            const { createElement, useLayoutEffect, useRef, useState } = system.React;
            return {
              components: {
                authorizeBtn: () => null,
                authorizeOperationBtn: () => null,
                auths: () => null,
              },
              wrapComponents: {
                info: (Original: SwaggerComponent) =>
                  function EmbeddedInfo(props: Record<string, unknown>) {
                    const container = useRef<HTMLDivElement | null>(null);
                    useLayoutEffect(() => {
                      container.current?.querySelector('.title')?.setAttribute('aria-level', '3');
                    });
                    return createElement('div', { ref: container }, createElement(Original, props));
                  },
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
      const status = cause instanceof ApiError ? cause.status : undefined;
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
    return () => {
      stopTracking();
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
        class="select w-auto max-w-full bg-white"
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
      <Button
        variant="outlined-static"
        class="mt-2"
        onclick={() => void load(available.length === 0)}>Retry</Button
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
