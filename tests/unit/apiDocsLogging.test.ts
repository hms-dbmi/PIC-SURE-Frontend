// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn((event_type: string, action: string, metadata: unknown) => ({
    event_type,
    action,
    metadata,
  })),
}));

import { log } from '$lib/logger';
import { toggleLoggingPlugin, trackDocsInteractions, type LayoutSystem } from '$lib/apiDocsLogging';

// Stands in for the Immutable.js maps Swagger keeps its operations in.
function immutable(value: Record<string, unknown>) {
  return {
    get: (key: string) => value[key],
    getIn: (path: string[]) =>
      path.reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], value),
  };
}

function systemWith(operations: Record<string, Record<string, unknown>[]>): LayoutSystem {
  return {
    specSelectors: {
      taggedOperations: () => ({
        getIn: ([tag]: string[]) =>
          operations[tag] && { find: (test) => operations[tag].map(immutable).find(test) },
      }),
    },
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

describe('toggleLoggingPlugin', () => {
  const original = vi.fn((...args: unknown[]) => args);
  const show = toggleLoggingPlugin(() => 'hpds-query-service').statePlugins.layout.wrapActions.show(
    original,
    system,
  );

  beforeEach(() => {
    vi.mocked(log).mockClear();
    original.mockClear();
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

describe('trackDocsInteractions', () => {
  let host: HTMLDivElement;
  let stop: () => void;

  beforeEach(() => {
    vi.mocked(log).mockClear();
    host = document.createElement('div');
    host.innerHTML = `
      <a href="https://docs.example.org/guide"><span id="link-text">guide</span></a>
      <div class="servers"><select id="servers"><option>/picsure</option></select></div>
      <div class="opblock">
        <div class="opblock-summary">
          <span class="opblock-summary-method">POST</span>
          <span data-path="/query">/query</span>
          <div class="copy-to-clipboard"><button id="copy-path"></button></div>
        </div>
        <button class="tablinks" data-name="model" id="schema-tab">Schema</button>
        <button class="tablinks" data-name="example" id="example-tab">Example Value</button>
        <button class="tablinks" id="unnamed-tab"> Callbacks </button>
        <div class="highlight-code">
          <div class="copy-to-clipboard"><button id="copy-code"></button></div>
          <button class="download-contents" id="download">Download</button>
        </div>
        <button class="model-box-control" aria-expanded="false" id="nested">
          <span class="model-title"><span class="model-hint">#/x</span><span class="model-title__text">Detail</span></span>
        </button>
        <select class="content-type" id="media"><option>application/json</option></select>
        <div class="examples-select"><select id="examples"><option>first</option></select></div>
        <select aria-label="Other control" id="labelled"><option>a</option></select>
        <select id="bare"><option>b</option></select>
        <button id="plain">Plain</button>
      </div>
      <section class="models">
        <div class="model-container">
          <button class="model-box-control" aria-expanded="true" id="top-schema"></button>
          <button class="model-box-control" aria-expanded="true" id="inner-schema"></button>
        </div>
      </section>
      <p id="text">Text</p>`;
    document.body.append(host);
    stop = trackDocsInteractions(host, () => 'dictionary');
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
    ['example-tab', 'api.docs_tab_select', { tab: 'example', ...operation }],
    ['unnamed-tab', 'api.docs_tab_select', { tab: 'Callbacks', ...operation }],
    ['copy-path', 'api.docs_copy', { target: 'path', ...operation }],
    ['copy-code', 'api.docs_copy', { target: 'code', ...operation }],
    ['download', 'api.docs_download', operation],
    [
      'nested',
      'api.docs_toggle',
      { kind: 'schema_property', name: 'Detail', shown: true, ...operation },
    ],
    ['inner-schema', 'api.docs_toggle', { kind: 'schema_property', shown: false }],
  ])('logs a click on #%s', (id, action, metadata) => {
    click(id);
    expect(logged()).toEqual([
      { event_type: 'ACTION', action, metadata: { service: 'dictionary', ...metadata } },
    ]);
  });

  it.each(['plain', 'text', 'top-schema'])('ignores a click on #%s', (id) => {
    click(id);
    expect(log).not.toHaveBeenCalled();
  });

  it.each([
    ['servers', { control: 'server', value: '/picsure' }],
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

  it('ignores changes outside a select and stops when removed', () => {
    host.dispatchEvent(new Event('change', { bubbles: true }));
    stop();
    click('download');
    change('media');
    expect(log).not.toHaveBeenCalled();
  });
});
