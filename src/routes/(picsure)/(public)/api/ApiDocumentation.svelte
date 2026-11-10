<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import { SvelteURL } from 'svelte/reactivity';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { SwaggerComponent, SwaggerSystem } from 'swagger-ui-dist/swagger-ui-bundle.js';
  import { ApiError } from '#lib/api/errors.ts';
  import { getDocumentedServices, getOpenApiDocument } from '#lib/api/picsure/openapi.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import Button from '#lib/ui/Button.svelte';
  import LiveRegion from '#lib/ui/LiveRegion.svelte';
  import Tabs from '#lib/ui/Tabs.svelte';
  import { createAnnouncer } from '#lib/ui/announcer.svelte.ts';
  import { createLog, log } from '#lib/telemetry/logger.ts';
  import { createDocsLogging } from './apiDocsLogging.ts';

  // The first visible service is shown on load: the dictionary, which every visitor can use.
  const services = [
    { name: 'dictionary', title: 'Dictionary', signedInOnly: false },
    { name: 'hpds-query-service', title: 'Authorized Queries', signedInOnly: true },
    { name: 'hpds-open-access', title: 'Open Queries', signedInOnly: false },
  ];
  const SERVICE_PARAM = 'service';
  const UNAVAILABLE = 'API documentation is unavailable on this deployment.';
  type SelectSource = 'tab' | 'url' | 'session';

  let documented = $state.raw<string[]>([]);
  const visible = $derived(
    services.filter(
      (service) =>
        documented.includes(service.name) && (session.isLoggedIn || !service.signedInOnly),
    ),
  );
  const tabs = $derived(visible.map((service) => ({ value: service.name, label: service.title })));
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
  // Set by a change of service or a retry, so the document that arrives is announced; the first
  // load's isn't.
  let announceNext = false;
  const docsLogging = createDocsLogging(() => shownService);
  const announcer = createAnnouncer({ repeat: true });

  const titleOf = (name: string) => services.find((service) => service.name === name)?.title;

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

  // Swagger renders and replaces its headings as the visitor expands sections.
  const nestHeadings: Attachment<HTMLElement> = (root) => {
    const observer = new MutationObserver(() => setHeadingLevels(root));
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  };

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
        const names = await getDocumentedServices(signal);
        if (request !== generation) return;
        // Only these researcher-facing services belong on this page. Construct local
        // paths ourselves rather than trusting registry URLs or Swagger configuration.
        documented = names;
        selected = serviceFromUrl() ?? visible[0]?.name ?? '';
        if (!selected) {
          fail(UNAVAILABLE);
          return;
        }
      }
      stage = 'document';
      const document = await getOpenApiDocument(selected, signal);
      if (request !== generation) return;
      shownService = selected;
      if (viewer) {
        viewer.specActions.updateSpec(JSON.stringify(document));
        announceShown();
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
      announceShown();
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
      fail(unavailable ? UNAVAILABLE : 'Unable to load API documentation. Please try again.');
    } finally {
      if (request === generation) loading = false;
    }
  }

  function fail(message: string) {
    error = message;
    announceNext = false;
    void announcer.announce(message);
  }

  function retry() {
    announceNext = true;
    void load(documented.length === 0 || !selected);
  }

  function announceShown() {
    if (!announceNext) return;
    announceNext = false;
    void announcer.announce(`Showing the ${titleOf(selected)} API documentation.`);
  }

  function visibleService(name: string | null): string | undefined {
    return visible.find((service) => service.name === name)?.name;
  }

  // On load, a link's service replaces the default; a value this visitor can't see is dropped
  // from the address.
  function serviceFromUrl(): string | undefined {
    const linked = visibleService(page.url.searchParams.get(SERVICE_PARAM));
    if (!linked && page.url.searchParams.has(SERVICE_PARAM)) setServiceParam(undefined);
    if (linked && linked !== visible[0]?.name) logSelect(linked, 'url');
    return linked;
  }

  // A navigation, not shallow routing: page.url and SvelteKit's own idea of the address stay
  // current, so links within the page and Back keep the parameter. It replaces the entry, adds
  // no history, and leaves scroll and focus alone.
  function setServiceParam(name: string | undefined) {
    const url = new SvelteURL(page.url.href);
    if (name) {
      url.searchParams.set(SERVICE_PARAM, name);
      url.hash = 'api-access';
    } else {
      url.searchParams.delete(SERVICE_PARAM);
    }
    void goto(url, { replace: true, reset: false, state: page.state });
  }

  function logSelect(to: string, source: SelectSource) {
    log(
      createLog('ACTION', 'api.docs_service_select', {
        from: shownService || undefined,
        to,
        source,
      }),
    );
  }

  function showService(name: string, source: SelectSource) {
    logSelect(name, source);
    selected = name;
    announceNext = true;
    void load(false);
  }

  function selectTab(name: string) {
    showService(name, 'tab');
    setServiceParam(name);
  }

  // A sign-out (here, in another tab, or by expiry) hides the authorized queries; move off them.
  $effect(() => {
    const names = visible.map((service) => service.name);
    untrack(() => {
      if (!selected || names.includes(selected)) return;
      if (names.length > 0) {
        showService(names[0], 'session');
        return;
      }
      generation++;
      controller?.abort();
      selected = '';
      loading = false;
      fail(UNAVAILABLE);
    });
  });

  // Back or Forward to an address naming another service. Read from the address bar, since not
  // every entry is SvelteKit's: Swagger's bundled smooth scroll pushes its own for #anchor links.
  function followHistory() {
    const linked = visibleService(new URLSearchParams(location.search).get(SERVICE_PARAM));
    if (linked && linked !== selected) showService(linked, 'url');
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

<svelte:window onpopstate={followHistory} />

<div class="api-documentation mt-6" data-testid="api-documentation">
  <LiveRegion message={announcer.message} data-testid="api-docs-announcement" />
  <Tabs
    {tabs}
    value={selected}
    onchange={selectTab}
    label="API documentation by service"
    variant="section"
    shared
    data-testid="api-docs-service"
  >
    {#snippet panel()}
      {#if loading}
        <p class="mx-0 mt-4">
          Loading API documentation{selected ? ` for ${titleOf(selected)}` : ''}…
        </p>
      {:else if error}
        <div class="border border-surface-200 rounded p-4 mt-4">
          <p class="mx-0">{error}</p>
          <Button variant="outlined-static" class="mt-2" onclick={retry}>Retry</Button>
        </div>
      {/if}
      <div
        bind:this={host}
        {@attach nestHeadings}
        class="swagger-host"
        hidden={!hasRendered || !!error}
      ></div>
    {/snippet}
  </Tabs>
</div>

<style>
  .api-documentation {
    min-width: 0;
  }
  /* Swagger draws in the site theme on the page's own background. Each HTTP method keeps its
     own semantic color, and every label pairs with text that keeps 4.5:1 in each theme. */
  .swagger-host {
    --swagger-text: var(--base-font-color);
    --swagger-muted: var(--color-surface-800);
    --swagger-line: var(--color-surface-200);
    color: var(--swagger-text);
    overflow-x: auto;
  }
  .swagger-host :global(.swagger-ui .wrapper) {
    padding: 0;
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
    padding: 12px 0;
    background: transparent;
    box-shadow: none;
  }
  .swagger-host :global {
    .swagger-ui :is(h1, h2, h3, h4, h5, h6, p, li, table, label, .opblock-tag, .tab li),
    .swagger-ui :is(.opblock-summary-path, .opblock-summary-description, .opblock-description),
    .swagger-ui :is(.parameter__name, .parameter__type, .response-col_status, .tablinks),
    .swagger-ui :is(.model, .model-title, .model-box-control, .models-control, .prop-type),
    .swagger-ui :is(.opblock-summary-operation-id, .opblock-summary-path__deprecated) {
      color: var(--swagger-text);
    }
    .swagger-ui :is(.parameter__in, .parameter__extension, .prop-format, .response-undocumented),
    .swagger-ui :is(.model .property.primitive, table.model tr.description),
    .swagger-ui :is(section.models h4, section.models h5, .response__extension),
    .swagger-ui :is(table.headers .header-example, .response-control-media-type__accept-message),
    .swagger-ui
      :is(.json-schema-2020-12-keyword--description, .json-schema-2020-12-expand-deep-button),
    .swagger-ui
      :is([class*='json-schema-2020-12-keyword__'], [class*='json-schema-2020-12-json-viewer__']),
    .swagger-ui .json-schema-2020-12__attribute--muted {
      color: var(--swagger-muted);
    }
    /* Swagger greys out deprecated schema properties with !important. */
    .swagger-ui .model .deprecated :is(span, td) {
      color: var(--swagger-muted) !important;
    }
    .swagger-ui :is(.json-schema-2020-12__title, .json-schema-2020-12__attribute),
    .swagger-ui :is([class*='json-schema-2020-12'][class*='__name--primary']),
    .swagger-ui :is([class*='json-schema-2020-12'][class*='__value--primary']) {
      color: var(--swagger-text);
    }
    .swagger-ui .json-schema-2020-12__attribute--primary {
      color: var(--color-primary-500);
    }
    .swagger-ui .parameter__name.required::after,
    .swagger-ui .parameter__name.required span,
    .swagger-ui :is(table.model tr.property-row .star, .parameter__deprecated),
    .swagger-ui :is(.model-deprecated-warning, .opblock-deprecated .opblock-title_normal),
    .swagger-ui :is(.json-schema-2020-12__attribute--warning, [class*='__value--warning']),
    .swagger-ui
      .json-schema-2020-12-property--required
      > .json-schema-2020-12:first-of-type
      > .json-schema-2020-12-head
      .json-schema-2020-12__title::after {
      color: var(--color-error-700);
      border-color: var(--color-error-700);
    }
    .swagger-ui :is(.info a, .markdown a, .renderedMarkdown a),
    .swagger-ui :is(.markdown code, .renderedMarkdown code) {
      color: var(--color-primary-500);
    }
    .swagger-ui :is(svg, .arrow) {
      fill: currentColor;
    }
    .swagger-ui .info .title small {
      background: var(--color-surface-800);
    }
    .swagger-ui .info .title small.version-stamp {
      background: var(--color-success-900);
    }
    .swagger-ui .json-schema-2020-12__constraint {
      background: var(--color-surface-800);
    }
    .swagger-ui .json-schema-2020-12__constraint--string {
      background: var(--color-warning-900);
    }
    .swagger-ui .opblock-tag,
    .swagger-ui section.models {
      border-color: var(--swagger-line);
    }
    .swagger-ui .tab li:first-of-type::after {
      background: var(--swagger-line);
    }
    .swagger-ui .opblock {
      --swagger-method: var(--color-surface-800);
      background: color-mix(in oklab, var(--swagger-method) 8%, transparent);
      border-color: var(--swagger-method);
      opacity: 1;
    }
    .swagger-ui .opblock-get {
      --swagger-method: var(--color-primary-500);
    }
    .swagger-ui .opblock-post {
      --swagger-method: var(--color-success-900);
    }
    .swagger-ui .opblock-put {
      --swagger-method: var(--color-warning-900);
    }
    .swagger-ui .opblock-delete {
      --swagger-method: var(--color-error-500);
    }
    .swagger-ui .opblock .opblock-summary {
      border-color: var(--swagger-method);
    }
    .swagger-ui .opblock .opblock-section-header {
      background: color-mix(in oklab, var(--swagger-method) 6%, transparent);
      box-shadow: none;
    }
    .swagger-ui .opblock .opblock-summary-method {
      background: var(--swagger-method);
      color: white;
      text-shadow: none;
    }
    .swagger-ui .opblock .tab-header .tab-item.active h4 span::after {
      background: var(--swagger-method);
    }
  }
  .swagger-host :global(.swagger-ui .opblock-summary-path) {
    overflow-wrap: anywhere;
  }
  .swagger-host :global(.swagger-ui .opblock-summary) {
    flex-wrap: wrap;
  }
</style>
