<script lang="ts">
  import type { FieldType } from '#lib/config/schema.ts';
  import { prettifyJson } from './configValue.ts';

  interface Props {
    /** The field's key; names the testids. */
    name: string;
    type: FieldType;
    value: string;
    disabled: boolean;
    /** From `configValueError`; shown under the input. */
    error: string;
  }

  let { name, type, value = $bindable(), disabled, error }: Props = $props();
</script>

{#if type === 'boolean'}
  {@const checked = value === 'true'}
  <label
    class="inline-flex items-center gap-2.5 relative {disabled
      ? 'cursor-default'
      : 'cursor-pointer'}"
    data-testid={`admin-config-field-toggle-${name}`}
  >
    <span
      class="w-9 h-[21px] rounded-full flex-none relative transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 has-[:focus-visible]:ring-offset-2 {checked
        ? 'bg-primary-500'
        : 'bg-surface-300-700'}"
    >
      <span
        class="absolute top-0.5 w-[17px] h-[17px] rounded-full bg-surface-50-950 shadow transition-all {checked
          ? 'left-[17px]'
          : 'left-0.5'}"
      ></span>
      <input
        type="checkbox"
        class="sr-only"
        data-testid={`admin-config-field-input-${name}`}
        {checked}
        {disabled}
        onchange={(e) => (value = e.currentTarget.checked ? 'true' : 'false')}
      />
    </span>
    <span class="text-[13.5px] font-medium opacity-80">{checked ? 'Enabled' : 'Disabled'}</span>
  </label>
{:else if type === 'json'}
  <div class="border border-surface-200-800 rounded-lg overflow-hidden bg-surface-50-950">
    <textarea
      class="textarea font-mono text-sm border-0 rounded-none focus:outline-none"
      data-testid={`admin-config-field-input-${name}`}
      rows="4"
      {disabled}
      bind:value></textarea>
    <div class="flex justify-end px-2.5 py-1.5 bg-surface-100-900 border-t border-surface-200-800">
      <button
        type="button"
        class="text-[11.5px] font-semibold text-primary-500 hover:underline px-1"
        data-testid={`admin-config-field-prettify-${name}`}
        {disabled}
        onclick={() => (value = prettifyJson(value))}
      >
        Pretty-print
      </button>
    </div>
  </div>
{:else if type === 'int'}
  <input
    type="text"
    inputmode="numeric"
    class="input {error ? 'border-error-500' : ''}"
    data-testid={`admin-config-field-input-${name}`}
    {disabled}
    bind:value
  />
{:else}
  <input
    type="text"
    class="input"
    data-testid={`admin-config-field-input-${name}`}
    {disabled}
    bind:value
  />
{/if}
{#if error}
  <p class="text-xs text-error-500 mt-1.5" data-testid={`admin-config-field-error-${name}`}>
    {error}
  </p>
{/if}
