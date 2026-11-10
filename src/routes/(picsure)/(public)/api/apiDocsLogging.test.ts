// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn((event_type: string, action: string, metadata: unknown) => ({
    event_type,
    action,
    metadata,
  })),
}));

import { log } from '#lib/telemetry/logger.ts';
import { createDocsLogging, type LayoutSystem } from './apiDocsLogging.ts';

// Stands in for the Immutable.js maps Swagger keeps its operations in.
function immutable(value: Record<string, unknown>) {
  return {
    get: (key: string) => value[key],
    getIn: (path: string[]) =>
      path.reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], value),
  };
}

const shownState = new Map<string, boolean>();

function systemWith(operations: Record<string, Record<string, unknown>[]>): LayoutSystem {
  return {
    specSelectors: {
      taggedOperations: () => ({
        getIn: ([tag]: string[]) =>
          operations[tag] && { find: (test) => operations[tag].map(immutable).find(test) },
      }),
    },
    layoutSelectors: { isShown: (key) => shownState.get(key.join('/')) },
  };
}

const system = systemWith({
  Query: [
    { method: 'post', path: '/query', operation: { operationId: 'runQuery' } },
    { method: 'get', path: '/query/{id}', operation: {} },
    {
      method: 'put',
      path: '/query/{id}',
      operation: { operationId: 'resolved', __originalOperationId: 'save query' },
    },
  ],
});

function logged() {
  return vi.mocked(log).mock.calls.map(([event]) => event);
}

// Records the state the way Swagger's layout reducer does.
const original = vi.fn((thing: unknown, shown?: boolean) => {
  if (Array.isArray(thing)) shownState.set(thing.join('/'), shown!);
});

function showFor(docsLogging: ReturnType<typeof createDocsLogging>) {
  return docsLogging.plugin.statePlugins.layout.wrapActions.show(original, system);
}

describe('the Swagger plugin', () => {
  const show = showFor(createDocsLogging(() => 'hpds-query-service'));

  beforeEach(() => {
    vi.mocked(log).mockClear();
    original.mockClear();
    shownState.clear();
  });

  it.each([
    [
      'an operation by its operationId',
      ['operations', 'Query', 'runQuery'],
      { kind: 'operation', tag: 'Query', method: 'post', path: '/query' },
    ],
    [
      'an operation by the id Swagger generates without one',
      ['operations', 'Query', 'get_query__id_'],
      { kind: 'operation', tag: 'Query', method: 'get', path: '/query/{id}' },
    ],
    [
      'an operation by its original operationId',
      ['operations', 'Query', 'save query'],
      { kind: 'operation', tag: 'Query', method: 'put', path: '/query/{id}' },
    ],
    [
      'an operation it cannot find',
      ['operations', 'Other', 'x'],
      { kind: 'operation', tag: 'Other' },
    ],
    ['a tag', ['operations-tag', 'Query'], { kind: 'tag', tag: 'Query' }],
    ['the Schemas section', ['components', 'schemas'], { kind: 'schemas' }],
    ['a schema', ['components', 'schemas', 'Query'], { kind: 'schema', name: 'Query' }],
  ])('logs %s', (_, key, metadata) => {
    show(key, false);
    expect(logged()).toEqual([
      {
        event_type: 'ACTION',
        action: 'api.docs_toggle',
        metadata: { service: 'hpds-query-service', ...metadata, shown: false },
      },
    ]);
    expect(original).toHaveBeenCalledWith(key, false);
  });

  it('logs only calls that change the state', () => {
    show(['operations-tag', 'Query'], false);
    show(['operations-tag', 'Query'], false);
    show(['components', 'schemas', 'Query'], true);
    show(['components', 'schemas', 'Query'], true);
    expect(logged().map((event) => event.metadata)).toEqual([
      { service: 'hpds-query-service', kind: 'tag', tag: 'Query', shown: false },
      { service: 'hpds-query-service', kind: 'schema', name: 'Query', shown: true },
    ]);
    expect(original).toHaveBeenCalledTimes(4);
  });

  it('treats a missing shown argument as expanding and reads Immutable keys', () => {
    show({ toJS: () => ['operations-tag', 'Query'] });
    expect(logged()[0]).toMatchObject({ metadata: { kind: 'tag', shown: true } });
  });

  it.each([
    ['tab state', ['paths', '/query', 'post', 'show-model-tab']],
    ['a nested schema path', ['components', 'schemas', 'Query', 'properties']],
    ['an unrelated key', ['errorPane']],
    ['a key that is not a list of strings', [1, 2]],
    ['a string key', 'errorPane'],
  ])('ignores %s but still runs the action', (_, key) => {
    show(key, true);
    expect(log).not.toHaveBeenCalled();
    expect(original).toHaveBeenCalledWith(key, true);
  });
});

describe('the click and change listeners', () => {
  let host: HTMLDivElement;
  let docsLogging: ReturnType<typeof createDocsLogging>;
  let stop: () => void;

  beforeEach(() => {
    vi.mocked(log).mockClear();
    host = document.createElement('div');
    host.innerHTML = `
      <a href="https://docs.example.org/guide"><span id="link-text">guide</span></a>
      <div class="servers">
        <select id="servers"><option>/picsure</option></select>
        <select data-variable="version" id="server-variable"><option>v2</option></select>
      </div>
      <div class="opblock">
        <div class="opblock-summary">
          <span class="opblock-summary-method">POST</span>
          <span data-path="/query">/query</span>
          <div class="copy-to-clipboard"><button id="copy-path"></button></div>
        </div>
        <button class="tablinks" data-name="model" aria-selected="false" id="schema-tab">Schema</button>
        <button class="tablinks" data-name="example" aria-selected="true" id="example-tab">Example Value</button>
        <div class="tab-header">
          <div class="tab-item active"><h4 id="parameters-tab"><span>Parameters</span></h4></div>
          <div class="tab-item"><h4 id="callbacks-tab"><span> Callbacks </span></h4></div>
        </div>
        <button class="model-box-control" aria-expanded="false" id="nested">
          <span class="model-title"><span class="model-hint">#/x</span><span class="model-title__text">Detail</span></span>
        </button>
        <select class="content-type" id="media"><option>application/json</option></select>
        <div class="examples-select"><select id="examples"><option>first</option></select></div>
        <select aria-label="Other control" id="labelled"><option>a</option></select>
        <select id="bare"><option>b</option></select>
        <button id="plain">Plain</button>
        <article class="json-schema-2020-12" data-json-schema-level="0">
          <div class="json-schema-2020-12-head">
            <button class="json-schema-2020-12-accordion" id="accordion">
              <div class="json-schema-2020-12-accordion__children">
                <strong class="json-schema-2020-12__title">Child</strong>
              </div>
              <span class="json-schema-2020-12-accordion__icon json-schema-2020-12-accordion__icon--collapsed"></span>
            </button>
            <button class="json-schema-2020-12-expand-deep-button" id="expand-all">Expand all</button>
          </div>
        </article>
      </div>
      <section class="models">
        <div class="model-container">
          <button class="model-box-control" aria-expanded="true" id="top-schema"></button>
          <button class="model-box-control" aria-expanded="true" id="inner-schema"></button>
        </div>
        <div class="no-margin">
          <article class="json-schema-2020-12" data-json-schema-level="0">
            <div class="json-schema-2020-12-head">
              <button class="json-schema-2020-12-accordion" id="top-31-schema"></button>
              <button class="json-schema-2020-12-expand-deep-button" id="top-31-expand">Expand all</button>
            </div>
            <div class="json-schema-2020-12-body">
              <button class="json-schema-2020-12-accordion" id="keyword">
                <span class="json-schema-2020-12-keyword__name">All of</span>
                <span class="json-schema-2020-12-accordion__icon json-schema-2020-12-accordion__icon--expanded"></span>
              </button>
              <article class="json-schema-2020-12" data-json-schema-level="1">
                <div class="json-schema-2020-12-head">
                  <strong class="json-schema-2020-12__title">note</strong>
                  <button class="json-schema-2020-12-expand-deep-button" id="inner-collapse-all">Collapse all</button>
                </div>
              </article>
            </div>
          </article>
        </div>
      </section>
      <p id="text">Text</p>`;
    document.body.append(host);
    docsLogging = createDocsLogging(() => 'dictionary');
    stop = docsLogging.track(host);
  });

  afterEach(() => {
    stop();
    host.remove();
  });

  const operation = { method: 'post', path: '/query' };
  const click = (id: string) =>
    host.querySelector(`#${id}`)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const change = (id: string) =>
    host.querySelector(`#${id}`)!.dispatchEvent(new Event('change', { bubbles: true }));

  it.each([
    ['link-text', 'api.docs_link_click', { url: 'https://docs.example.org/guide' }],
    ['schema-tab', 'api.docs_tab_select', { tab: 'schema', ...operation }],
    ['callbacks-tab', 'api.docs_tab_select', { tab: 'callbacks', ...operation }],
    ['copy-path', 'api.docs_copy', operation],
    [
      'nested',
      'api.docs_toggle',
      { kind: 'schema_property', name: 'Detail', shown: true, ...operation },
    ],
    ['inner-schema', 'api.docs_toggle', { kind: 'schema_property', shown: false }],
    [
      'accordion',
      'api.docs_toggle',
      { kind: 'schema_property', name: 'Child', shown: true, ...operation },
    ],
    [
      'expand-all',
      'api.docs_toggle',
      { kind: 'schema_property', name: 'Child', shown: true, all: true, ...operation },
    ],
    [
      'inner-collapse-all',
      'api.docs_toggle',
      { kind: 'schema_property', name: 'note', shown: false, all: true },
    ],
    ['keyword', 'api.docs_toggle', { kind: 'schema_property', name: 'All of', shown: false }],
  ])('logs a click on #%s', (id, action, metadata) => {
    click(id);
    expect(logged()).toEqual([
      { event_type: 'ACTION', action, metadata: { service: 'dictionary', ...metadata } },
    ]);
  });

  it.each([
    'plain',
    'text',
    'example-tab',
    'parameters-tab',
    'top-schema',
    'top-31-schema',
    'top-31-expand',
  ])('ignores a click on #%s', (id) => {
    click(id);
    expect(log).not.toHaveBeenCalled();
  });

  it.each([
    ['servers', { control: 'server', value: '/picsure' }],
    ['server-variable', { control: 'server_variable', value: 'v2' }],
    ['media', { control: 'media_type', value: 'application/json', ...operation }],
    ['examples', { control: 'example', value: 'first', ...operation }],
    ['labelled', { control: 'Other control', value: 'a', ...operation }],
    ['bare', { control: 'bare', value: 'b', ...operation }],
  ])('logs a change of #%s', (id, metadata) => {
    change(id);
    expect(logged()).toEqual([
      {
        event_type: 'ACTION',
        action: 'api.docs_select',
        metadata: { service: 'dictionary', ...metadata },
      },
    ]);
  });

  it('marks the schema toggle a top-level Expand all causes as one for everything', async () => {
    const show = showFor(docsLogging);
    shownState.clear();
    // Swagger's own handler runs during the click and calls show synchronously.
    host
      .querySelector('#top-31-expand')!
      .addEventListener('click', () => show(['components', 'schemas', 'Detail'], true));
    click('top-31-expand');
    await new Promise((resolve) => setTimeout(resolve));
    show(['components', 'schemas', 'Detail'], false);
    expect(logged().map((event) => event.metadata)).toEqual([
      { service: 'dictionary', kind: 'schema', name: 'Detail', shown: true, all: true },
      { service: 'dictionary', kind: 'schema', name: 'Detail', shown: false },
    ]);
  });

  it('ignores changes outside a select and stops when removed', () => {
    host.dispatchEvent(new Event('change', { bubbles: true }));
    stop();
    click('copy-path');
    change('media');
    expect(log).not.toHaveBeenCalled();
  });
});
