<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwaggerComponent, SwaggerSystem } from 'swagger-ui-dist/swagger-ui-bundle.js';

  const services = [
    { name: 'hpds-query-service', title: 'HPDS queries' },
    { name: 'dictionary', title: 'Dictionary' },
  ];
  let available = $state<typeof services>([]);
  let selected = $state('');
  let loading = $state(true);
  let error = $state('');
  let host: HTMLDivElement;
  let controller: AbortController | undefined;
  let generation = 0;
  let viewer: SwaggerSystem | undefined;
  let disposeViewer: (() => void) | undefined;

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
      if (viewer) {
        viewer.specActions.updateSpec(JSON.stringify(document));
        return;
      }
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
                      return () => {
                        disposeViewer = undefined;
                      };
                    }, []);
                    return visible ? createElement(Original, props) : null;
                  },
              },
            };
          },
        ],
      });
    } catch (cause) {
      if (request !== generation) return;
      error =
        index && cause instanceof DocumentationResponseError && cause.status === 404
          ? 'API documentation is unavailable on this deployment.'
          : 'Unable to load API documentation. Please try again.';
    } finally {
      if (request === generation) loading = false;
    }
  }

  onMount(() => {
    void load(true);
    return () => {
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
    <label for="api-document-service" class="block font-bold mb-2">API documentation</label>
    <select
      id="api-document-service"
      class="select mb-4 max-w-full"
      bind:value={selected}
      onchange={() => void load(false)}
    >
      {#each available as service (service.name)}
        <option value={service.name}>{service.title}</option>
      {/each}
    </select>
  {/if}
  {#if loading}
    <p role="status" class="mx-0">Loading API documentation…</p>
  {:else if error}
    <div role="status" class="border border-surface-200 rounded p-4">
      <p class="mx-0">{error}</p>
      <button
        class="btn preset-outlined-primary-500 mt-2"
        onclick={() => void load(available.length === 0)}>Retry</button
      >
    </div>
  {/if}
  <div bind:this={host} class="swagger-host" hidden={loading || !!error}></div>
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
