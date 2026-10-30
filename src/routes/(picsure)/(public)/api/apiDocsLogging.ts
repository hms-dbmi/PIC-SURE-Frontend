import { createLog, log } from '#lib/telemetry/logger.ts';

// Logs what visitors do inside the embedded Swagger viewer on the API page. Expand and collapse
// go through Swagger's layout.show action; tabs, copy buttons, links and selects are local
// component state there, so they are read from DOM events on the viewer's host element.

type Metadata = Record<string, unknown>;

interface OperationRef {
  method: string;
  path: string;
}

// Swagger's state is Immutable.js; only the few methods used here are typed.
interface ImmutableLike {
  get(key: string): unknown;
  getIn(path: string[]): unknown;
  toJS?(): unknown;
}

interface TaggedOperations {
  getIn(path: string[]): { find(test: (operation: ImmutableLike) => boolean): unknown } | undefined;
}

export interface LayoutSystem {
  specSelectors: { taggedOperations(): TaggedOperations };
  layoutSelectors: { isShown(thing: string[]): boolean | undefined };
}

type ShowAction = (thing: unknown, shown?: boolean) => unknown;

const MAX_TEXT = 200;

function trimmed(text: string | null | undefined): string | undefined {
  const value = text?.replace(/\s+/g, ' ').trim();
  return value ? value.slice(0, MAX_TEXT) : undefined;
}

function toKey(thing: unknown): string[] | undefined {
  const plain =
    thing && typeof (thing as ImmutableLike).toJS === 'function'
      ? (thing as ImmutableLike).toJS!()
      : thing;
  if (typeof plain === 'string') return [plain];
  if (Array.isArray(plain) && plain.every((part) => typeof part === 'string')) return plain;
  return undefined;
}

// Swagger keys an operation by [tag, operationId]. For an operation without an operationId it
// generates one the way swagger-client's idFromPathMethod does: the method, then the path with
// every non-word character replaced by an underscore (GET /query/{id} becomes get_query__id_).
function findOperation(
  system: LayoutSystem,
  tag: string,
  operationId: string,
): OperationRef | undefined {
  const operations = system.specSelectors.taggedOperations().getIn([tag, 'operations']);
  const match = operations?.find((operation) => {
    const method = String(operation.get('method'));
    const path = String(operation.get('path'));
    const declared =
      operation.getIn(['operation', '__originalOperationId']) ||
      operation.getIn(['operation', 'operationId']);
    return (declared || `${method}${path.replace(/\W/g, '_')}`) === operationId;
  }) as ImmutableLike | undefined;
  if (!match) return undefined;
  return { method: String(match.get('method')), path: String(match.get('path')) };
}

function describeToggle(
  key: string[],
  shown: boolean,
  lookup: (tag: string, operationId: string) => OperationRef | undefined,
): Metadata | undefined {
  const [root, first, second] = key;
  if (root === 'operations' && key.length === 3) {
    return { kind: 'operation', tag: first, ...lookup(first, second), shown };
  }
  if (root === 'operations-tag' && key.length === 2) return { kind: 'tag', tag: first, shown };
  if (root !== 'components' || first !== 'schemas') return undefined;
  if (key.length === 2) return { kind: 'schemas', shown };
  if (key.length === 3) return { kind: 'schema', name: second, shown };
  return undefined;
}

function toggleLoggingPlugin(getService: () => string, isDeepClick: () => boolean) {
  return {
    statePlugins: {
      layout: {
        wrapActions: {
          show:
            (original: ShowAction, system: LayoutSystem): ShowAction =>
            (thing, shown = true) => {
              const key = toKey(thing);
              const metadata =
                key &&
                describeToggle(key, shown, (tag, operationId) =>
                  findOperation(system, tag, operationId),
                );
              // Swagger also calls show without a user action, such as when an expanded schema
              // remounts, and twice for one click on a tag's arrow; neither changes the state.
              if (metadata && system.layoutSelectors.isShown(key) !== shown) {
                if (metadata.kind === 'schema' && isDeepClick()) metadata.all = true;
                log(createLog('ACTION', 'api.docs_toggle', { service: getService(), ...metadata }));
              }
              return original(thing, shown);
            },
        },
      },
    },
  };
}

function operationContext(element: Element): Metadata {
  const block = element.closest('.opblock');
  if (!block) return {};
  const method = trimmed(block.querySelector('.opblock-summary-method')?.textContent);
  const path = block.querySelector('[data-path]')?.getAttribute('data-path') ?? undefined;
  return { method: method?.toLowerCase(), path };
}

// OpenAPI 3.0 schemas render with a model box control, 3.1 schemas with the json-schema-2020-12
// accordion and its Expand all button.
const MODEL_BOX = '.model-box-control';
const SCHEMA_ACCORDION = '.json-schema-2020-12-accordion';
const SCHEMA_EXPAND = '.json-schema-2020-12-expand-deep-button';
const SCHEMA_HEAD = '.json-schema-2020-12-head';
const SCHEMA_TITLE = '.json-schema-2020-12__title';
const SCHEMA_TOGGLES = `${MODEL_BOX}, ${SCHEMA_ACCORDION}, ${SCHEMA_EXPAND}`;

// The top-level toggles of a schema in the Schemas section (including 3.1's Expand all) also
// fire layout.show, which toggleLoggingPlugin already logs; only nested ones are left to the DOM.
function isTopLevelSchemaToggle(button: Element): boolean {
  if (!button.closest('.models')) return false;
  const head = button.closest(SCHEMA_HEAD);
  if (head) return head.parentElement?.getAttribute('data-json-schema-level') === '0';
  const container = button.closest('.model-container');
  return !!container && container.querySelector(MODEL_BOX) === button;
}

function isTopLevelExpandAll(target: EventTarget | null): boolean {
  const button = target instanceof Element && target.closest(SCHEMA_EXPAND);
  return !!button && isTopLevelSchemaToggle(button);
}

// Read before the click's re-render, so the new state is the opposite of the current one.
function schemaToggle(button: Element): Metadata {
  if (button.matches(SCHEMA_EXPAND)) {
    const head = button.closest(SCHEMA_HEAD) ?? button.parentElement;
    return {
      name: trimmed(head?.querySelector(SCHEMA_TITLE)?.textContent),
      shown: trimmed(button.textContent) === 'Expand all',
      all: true,
    };
  }
  if (button.matches(SCHEMA_ACCORDION)) {
    // A keyword accordion such as All of has a keyword name instead of a title.
    const label = button.querySelector(SCHEMA_TITLE) ?? button;
    return {
      name: trimmed(label.textContent),
      shown: !button.querySelector('.json-schema-2020-12-accordion__icon--expanded'),
    };
  }
  return {
    name: trimmed(button.querySelector('.model-title__text')?.textContent),
    shown: button.getAttribute('aria-expanded') !== 'true',
  };
}

interface DocsEvent {
  action: string;
  metadata: Metadata;
}

function describeClick(target: EventTarget | null): DocsEvent | undefined {
  if (!(target instanceof Element)) return undefined;
  const link = target.closest('a[href]');
  if (link) {
    return { action: 'api.docs_link_click', metadata: { url: link.getAttribute('href') } };
  }
  // OpenAPI 3 operations show a Parameters tab, plus a Callbacks tab when they have callbacks.
  const tabItem = target.closest('.tab-header .tab-item');
  if (tabItem) {
    if (tabItem.classList.contains('active')) return undefined;
    const tab = trimmed(tabItem.textContent)?.toLowerCase();
    return { action: 'api.docs_tab_select', metadata: { tab, ...operationContext(tabItem) } };
  }
  const button = target.closest('button');
  if (!button) return undefined;
  const context = operationContext(button);
  if (button.classList.contains('tablinks')) {
    if (button.getAttribute('aria-selected') === 'true') return undefined;
    const name = button.getAttribute('data-name');
    return {
      action: 'api.docs_tab_select',
      metadata: { tab: name === 'model' ? 'schema' : name, ...context },
    };
  }
  // With requests disabled, the only copy button Swagger renders is the one for a path.
  if (button.closest('.copy-to-clipboard')) {
    return { action: 'api.docs_copy', metadata: context };
  }
  if (button.matches(SCHEMA_TOGGLES) && !isTopLevelSchemaToggle(button)) {
    return {
      action: 'api.docs_toggle',
      metadata: { kind: 'schema_property', ...schemaToggle(button), ...context },
    };
  }
  return undefined;
}

function selectControl(select: HTMLSelectElement): string {
  if (select.hasAttribute('data-variable')) return 'server_variable';
  if (select.closest('.servers')) return 'server';
  if (select.classList.contains('content-type')) return 'media_type';
  if (select.closest('.examples-select')) return 'example';
  return trimmed(select.getAttribute('aria-label') ?? select.id) ?? 'unknown';
}

function describeChange(target: EventTarget | null): DocsEvent | undefined {
  if (!(target instanceof HTMLSelectElement)) return undefined;
  return {
    action: 'api.docs_select',
    metadata: {
      control: selectControl(target),
      value: trimmed(target.value),
      ...operationContext(target),
    },
  };
}

// The Swagger plugin to pass to SwaggerUI, and a function that starts listening on the viewer's
// host element and returns one that stops.
export function createDocsLogging(getService: () => string) {
  // Swagger turns a top-level Expand all or Collapse all into the same layout.show as a plain
  // toggle, so the click marks the show it causes as one that expands or collapses everything.
  let deepClick = false;
  const plugin = toggleLoggingPlugin(getService, () => deepClick);

  function track(host: HTMLElement): () => void {
    const report = (event: DocsEvent | undefined) => {
      if (event) {
        log(createLog('ACTION', event.action, { service: getService(), ...event.metadata }));
      }
    };
    // Capture runs before Swagger's own click handlers, which call show synchronously.
    const markDeep = (event: Event) => {
      deepClick = isTopLevelExpandAll(event.target);
      if (deepClick) setTimeout(() => (deepClick = false));
    };
    const onClick = (event: Event) => report(describeClick(event.target));
    const onChange = (event: Event) => report(describeChange(event.target));
    host.addEventListener('click', markDeep, true);
    host.addEventListener('click', onClick);
    host.addEventListener('change', onChange);
    return () => {
      host.removeEventListener('click', markDeep, true);
      host.removeEventListener('click', onClick);
      host.removeEventListener('change', onChange);
    };
  }

  return { plugin, track };
}
