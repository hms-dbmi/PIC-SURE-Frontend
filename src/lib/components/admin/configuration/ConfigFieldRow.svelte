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

  // The field's active value: whatever describeConfigField resolved (api > env >
  // default), so the input/checkbox is pre-populated with what's actually in effect,
  // not just what happens to be stored as an API row.
  let resolvedValue = $derived.by(() => {
    if (fieldOrigin.origin === 'api') return apiRow?.value ?? '';
    if (fieldOrigin.origin === 'env') return fieldOrigin.envValue ?? '';
    return typeof schema.default === 'string' ? schema.default : JSON.stringify(schema.default);
  });

  let value: string = $derived(resolvedValue);
  let dirty = $derived(value !== resolvedValue);

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

  function prettify() {
    try {
      value = JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      // Invalid JSON - leave value untouched, jsonError below already surfaces it.
    }
  }

  const originLabel = { env: 'Env', api: 'API', default: 'Default' };
  const originClass = {
    env: 'preset-tonal-primary border border-primary-500',
    api: 'preset-tonal-success border border-success-500',
    default: 'preset-tonal-surface border border-surface-500',
  };
  const originDotClass = {
    env: 'bg-primary-500',
    api: 'bg-success-500',
    default: 'bg-surface-500',
  };

  const DESCRIPTION_LIMIT = 150;
  let expanded = $state(false);
  let descriptionTruncatable = $derived((schema.description?.length ?? 0) > DESCRIPTION_LIMIT);
  let displayDescription = $derived(
    descriptionTruncatable && !expanded
      ? `${schema.description.slice(0, DESCRIPTION_LIMIT).trim()}…`
      : schema.description,
  );
</script>

<div
  class="card border bg-white border-surface-200-800 rounded-xl p-5 shadow-sm {rowDisabled
    ? 'opacity-55'
    : ''}"
  data-testid={`config-field-row-${schema.name}`}
>
  <div class="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-6 items-start">
    <div class="min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-semibold text-[15px]">{label}</span>
        <span class="text-[11.5px] font-mono opacity-70 bg-surface-100-900 px-1.5 py-0.5 rounded"
          >{schema.name}</span
        >
      </div>
      {#if schema.description}
        <p
          class="text-xs opacity-70 mt-1 leading-relaxed"
          data-testid={`config-field-description-${schema.name}`}
        >
          {displayDescription}
        </p>
        {#if descriptionTruncatable}
          <button
            type="button"
            class="text-xs font-semibold text-primary-500 hover:underline mt-1"
            data-testid={`config-field-expand-${schema.name}`}
            onclick={() => (expanded = !expanded)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        {/if}
      {/if}
    </div>

    <div class="min-w-0">
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <span
          class="badge {originClass[
            fieldOrigin.origin
          ]} rounded-full inline-flex items-center gap-1.5"
          data-testid={`config-field-origin-${schema.name}`}
          title={`Resolved value: ${resolvedValue}`}
        >
          <span class="inline-block w-1.5 h-1.5 rounded-full {originDotClass[fieldOrigin.origin]}"
          ></span>
          {originLabel[fieldOrigin.origin]}
        </span>
        {#if rowDisabled}
          <span class="text-xs italic opacity-60">API unavailable</span>
        {/if}
      </div>

      {#if schema.type === 'boolean'}
        {@const checked = value === 'true'}
        <label
          class="inline-flex items-center gap-2.5 relative {rowDisabled
            ? 'cursor-default'
            : 'cursor-pointer'}"
          data-testid={`config-field-toggle-${schema.name}`}
        >
          <span
            class="w-9 h-[21px] rounded-full flex-none relative transition-colors {checked
              ? 'bg-primary-500'
              : 'bg-surface-300-700'}"
          >
            <span
              class="absolute top-0.5 w-[17px] h-[17px] rounded-full bg-surface-50-950 shadow transition-all {checked
                ? 'left-[17px]'
                : 'left-0.5'}"
            ></span>
          </span>
          <input
            type="checkbox"
            class="sr-only"
            data-testid={`config-field-input-${schema.name}`}
            {checked}
            disabled={rowDisabled}
            onchange={(e) => (value = e.currentTarget.checked ? 'true' : 'false')}
          />
          <span class="text-[13.5px] font-medium opacity-80"
            >{checked ? 'Enabled' : 'Disabled'}</span
          >
        </label>
      {:else if schema.type === 'json'}
        <div class="border border-surface-200-800 rounded-lg overflow-hidden bg-surface-50-950">
          <textarea
            class="textarea font-mono text-sm border-0 rounded-none focus:outline-none"
            data-testid={`config-field-input-${schema.name}`}
            rows="4"
            disabled={rowDisabled}
            bind:value
          ></textarea>
          <div
            class="flex justify-end px-2.5 py-1.5 bg-surface-100-900 border-t border-surface-200-800"
          >
            <button
              type="button"
              class="text-[11.5px] font-semibold text-primary-500 hover:underline px-1"
              data-testid={`config-field-prettify-${schema.name}`}
              disabled={rowDisabled}
              onclick={prettify}
            >
              Pretty-print
            </button>
          </div>
        </div>
        {#if jsonError}
          <p
            class="text-xs text-error-500 mt-1.5"
            data-testid={`config-field-error-${schema.name}`}
          >
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
          <p
            class="text-xs text-error-500 mt-1.5"
            data-testid={`config-field-error-${schema.name}`}
          >
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

      <div class="flex items-center gap-3.5 mt-3 min-h-[28px]">
        {#if dirty}
          <button
            type="button"
            class="btn btn-sm preset-filled-primary-500"
            data-testid={`config-field-save-${schema.name}`}
            disabled={rowDisabled || !valid}
            onclick={saveField}
          >
            Save
          </button>
        {/if}
        {#if apiRow?.uuid}
          <button
            type="button"
            class="text-xs font-semibold opacity-70 hover:opacity-100 hover:underline"
            data-testid={`config-field-reset-${schema.name}`}
            disabled={rowDisabled}
            onclick={resetField}
          >
            Reset to default
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>
