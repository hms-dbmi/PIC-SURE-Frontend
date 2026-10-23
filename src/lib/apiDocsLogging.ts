import { createLog, log } from '$lib/logger';

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
      operation.getIn(['operation', '__originalOperationId']) ??
      operation.getIn(['operation', 'operationId']);
    return (declared ?? `${method}${path.replace(/\W/g, '_')}`) === operationId;
  }) as ImmutableLike | undefined;
  if (!match) return undefined;
  return { method: String(match.get('method')), path: String(match.get('path')) };
}

function describeToggle(
  thing: unknown,
  shown: boolean,
  lookup: (tag: string, operationId: string) => OperationRef | undefined,
): Metadata | undefined {
  const key = toKey(thing);
  if (!key) return undefined;
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

export function toggleLoggingPlugin(getService: () => string) {
  return {
    statePlugins: {
      layout: {
        wrapActions: {
          show:
            (original: ShowAction, system: LayoutSystem): ShowAction =>
            (thing, shown = true) => {
              const metadata = describeToggle(thing, shown, (tag, operationId) =>
                findOperation(system, tag, operationId),
              );
              if (metadata) {
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

// The top-level toggle of a schema in the Schemas section also fires layout.show, which
// toggleLoggingPlugin already logs; only nested schema toggles are left to the DOM.
function isTopLevelSchemaToggle(button: Element): boolean {
  const container = button.closest('.models .model-container');
  return !!container && container.querySelector('.model-box-control') === button;
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
  const button = target.closest('button');
  if (!button) return undefined;
  const context = operationContext(button);
  if (button.classList.contains('tablinks')) {
    const name = button.getAttribute('data-name');
    const tab = name === 'model' ? 'schema' : (name ?? trimmed(button.textContent));
    return { action: 'api.docs_tab_select', metadata: { tab, ...context } };
  }
  if (button.closest('.copy-to-clipboard')) {
    const copied = button.closest('.opblock-summary') ? 'path' : 'code';
    return { action: 'api.docs_copy', metadata: { target: copied, ...context } };
  }
  if (button.classList.contains('download-contents')) {
    return { action: 'api.docs_download', metadata: context };
  }
  if (button.classList.contains('model-box-control') && !isTopLevelSchemaToggle(button)) {
    // Read before the click's re-render, so the new state is the opposite of aria-expanded.
    const shown = button.getAttribute('aria-expanded') !== 'true';
    const name = trimmed(button.querySelector('.model-title__text')?.textContent);
    return {
      action: 'api.docs_toggle',
      metadata: { kind: 'schema_property', name, shown, ...context },
    };
  }
  return undefined;
}

function selectControl(select: HTMLSelectElement): string {
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

export function trackDocsInteractions(host: HTMLElement, getService: () => string): () => void {
  const report = (event: DocsEvent | undefined) => {
    if (event) {
      log(createLog('ACTION', event.action, { service: getService(), ...event.metadata }));
    }
  };
  const onClick = (event: Event) => report(describeClick(event.target));
  const onChange = (event: Event) => report(describeChange(event.target));
  host.addEventListener('click', onClick);
  host.addEventListener('change', onChange);
  return () => {
    host.removeEventListener('click', onClick);
    host.removeEventListener('change', onChange);
  };
}
