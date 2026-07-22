<script lang="ts">
  import type { ConfigFieldSchema, ConfigObject } from '$lib/models/Configuration';
  import { describeConfigField } from '$lib/models/ConfigResolution';
  import {
    apiRowFor,
    addConfigRow,
    updateConfigRow,
    deleteConfigRow,
    type AdminConfigKind,
  } from '$lib/stores/AdminConfiguration';
  import { humanizeKey } from '$lib/utilities/Strings';
  import { toaster } from '$lib/toaster';

  interface Props {
    schema: ConfigFieldSchema;
    rows: ConfigObject[];
    apiAvailable: boolean;
    kind: AdminConfigKind;
  }

  let { schema, rows, apiAvailable, kind }: Props = $props();

  let label = $derived(humanizeKey(schema.name));

  let apiRow: ConfigObject | undefined = $derived(apiRowFor(rows, schema.name));
  let fieldOrigin = $derived(describeConfigField(schema.name, rows));
  let rowDisabled = $derived(!apiAvailable || fieldOrigin.disabled);

  let value: string = $derived(apiRow?.value ?? '');
  let dirty = $derived(value !== (apiRow?.value ?? ''));

  let jsonError = $derived.by(() => {
    if (schema.type !== 'json') return '';
    try {
      JSON.parse(value);
      return '';
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid JSON';
    }
  });
  let intValid = $derived(schema.type !== 'int' || /^-?\d+$/.test(value.trim()));
  let valid = $derived(!jsonError && intValid);

  let resolvedValueDisplay = $derived.by(() => {
    if (fieldOrigin.origin === 'api') return apiRow?.value ?? '';
    if (fieldOrigin.origin === 'env') return fieldOrigin.envValue ?? '';
    return typeof schema.default === 'string' ? schema.default : JSON.stringify(schema.default);
  });

  function serialize(): string {
    if (schema.type === 'int') return String(parseInt(value.trim(), 10));
    if (schema.type === 'json') return JSON.stringify(JSON.parse(value));
    return value;
  }

  async function saveField() {
    try {
      const serialized = serialize();
      if (apiRow?.uuid) {
        await updateConfigRow(kind, { ...apiRow, value: serialized });
      } else {
        await addConfigRow(kind, schema.name, serialized);
      }
      toaster.success({ title: `Saved ${label}` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to save ${label}` });
    }
  }

  async function resetField() {
    if (!apiRow?.uuid) return;
    try {
      await deleteConfigRow(kind, apiRow.uuid);
      toaster.success({ title: `Reset ${label} to default` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to reset ${label}` });
    }
  }

  const originLabel = { env: 'Env', api: 'API', default: 'Default' };
  const originClass = {
    env: 'preset-tonal-primary border border-primary-500',
    api: 'preset-tonal-success border border-success-500',
    default: 'preset-tonal-surface border border-surface-500',
  };
</script>

<div
  class="flex flex-wrap items-center gap-4 p-3 odd:bg-surface-100-900 even:bg-surface-50-950"
  data-testid={`config-field-row-${schema.name}`}
>
  <div class="flex-1 min-w-64">
    <div class="font-semibold">{label}</div>
    <div class="text-xs opacity-60 font-mono">{schema.name}</div>
    {#if schema.description}
      <p class="text-xs opacity-80 mt-1" data-testid={`config-field-description-${schema.name}`}>
        {schema.description}
      </p>
    {/if}
  </div>

  <span
    class="badge {originClass[fieldOrigin.origin]}"
    data-testid={`config-field-origin-${schema.name}`}
    title={`Resolved value: ${resolvedValueDisplay}`}
  >
    {originLabel[fieldOrigin.origin]}
  </span>

  <div class="flex-1 min-w-48">
    {#if schema.type === 'boolean'}
      <input
        type="checkbox"
        class="checkbox"
        data-testid={`config-field-input-${schema.name}`}
        checked={value === 'true'}
        disabled={rowDisabled}
        onchange={(e) => (value = e.currentTarget.checked ? 'true' : 'false')}
      />
    {:else if schema.type === 'json'}
      <textarea
        class="textarea font-mono text-sm"
        data-testid={`config-field-input-${schema.name}`}
        rows="2"
        disabled={rowDisabled}
        bind:value
      ></textarea>
      {#if jsonError}
        <p class="text-xs text-error-500" data-testid={`config-field-error-${schema.name}`}>
          {jsonError}
        </p>
      {/if}
    {:else if schema.type === 'int'}
      <input
        type="text"
        inputmode="numeric"
        class="input {!intValid ? 'border-error-500' : ''}"
        data-testid={`config-field-input-${schema.name}`}
        disabled={rowDisabled}
        bind:value
      />
      {#if !intValid}
        <p class="text-xs text-error-500" data-testid={`config-field-error-${schema.name}`}>
          Must be an integer.
        </p>
      {/if}
    {:else}
      <input
        type="text"
        class="input"
        data-testid={`config-field-input-${schema.name}`}
        disabled={rowDisabled}
        bind:value
      />
    {/if}
  </div>

  <div class="flex-none flex gap-2">
    <button
      type="button"
      title="Save"
      class="btn-icon-color"
      data-testid={`config-field-save-${schema.name}`}
      disabled={rowDisabled || !dirty || !valid}
      onclick={saveField}
    >
      <i class="fa-solid fa-floppy-disk fa-xl"></i>
      <span class="sr-only">Save</span>
    </button>
    {#if apiRow?.uuid}
      <button
        type="button"
        title="Reset to default"
        class="btn-icon-color"
        data-testid={`config-field-reset-${schema.name}`}
        disabled={rowDisabled}
        onclick={resetField}
      >
        <i class="fa-solid fa-arrow-rotate-right fa-xl"></i>
        <span class="sr-only">Reset to default</span>
      </button>
    {/if}
  </div>
</div>
