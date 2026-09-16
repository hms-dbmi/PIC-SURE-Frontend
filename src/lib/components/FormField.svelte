<script lang="ts">
  import type { FieldSchema } from '$lib/utilities/Validation';
  import { isRequired } from '$lib/utilities/Validation';
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import FieldError from '$lib/components/FieldError.svelte';

  interface Props {
    name: string;
    field: FieldSchema;
    value: string | string[];
    error?: string;
    onchange: (value: string | string[]) => void;
  }

  let { name, field, value, error, onchange }: Props = $props();

  const required = $derived(isRequired(field.rules));
  const testid = $derived(`register-field-${name}`);

  function toggleOption(optionValue: string, checked: boolean) {
    const selected = Array.isArray(value) ? value : [];
    onchange(checked ? [...selected, optionValue] : selected.filter((v) => v !== optionValue));
  }
</script>

{#snippet labelWithHelp()}
  <div class="inline-flex items-center gap-1 {required ? 'required' : ''}">
    <span>{field.label}</span>
    {#if field.help}<HelpInfoPopup id="{testid}-help" text={field.help} type="info" />{/if}
  </div>
{/snippet}

{#if field.type === 'multiselect'}
  <fieldset data-testid={testid} class="flex flex-col gap-2">
    <legend class="label mb-1">{@render labelWithHelp()}</legend>
    <div class="grid gap-3 sm:grid-cols-2">
      {#each field.options ?? [] as option (option.key)}
        {@const checked = Array.isArray(value) && value.includes(option.value)}
        <label
          class="flex cursor-pointer items-center gap-3 rounded-container border p-3 transition-colors {checked
            ? 'border-primary-500 bg-primary-50-950'
            : 'border-surface-300-700 hover:border-primary-300-700'}"
        >
          <input
            class="checkbox"
            type="checkbox"
            {checked}
            onchange={(e) => toggleOption(option.value, e.currentTarget.checked)}
          />
          <span class="text-sm">{option.text}</span>
        </label>
      {/each}
    </div>
  </fieldset>
{:else if field.type === 'select'}
  <label class="label {required ? 'required' : ''} flex flex-col gap-1.5" data-testid={testid}>
    {@render labelWithHelp()}
    <select
      class="w-full"
      value={typeof value === 'string' ? value : ''}
      {required}
      onchange={(e) => onchange(e.currentTarget.value)}
    >
      <option value="" disabled>{field.placeholder ?? 'Select...'}</option>
      {#each field.options ?? [] as option (option.key)}
        <option value={option.value}>{option.text}</option>
      {/each}
    </select>
  </label>
{:else}
  <label class="label {required ? 'required' : ''} flex flex-col gap-1.5" data-testid={testid}>
    {@render labelWithHelp()}
    <input
      type="text"
      class="input w-full"
      placeholder={field.placeholder}
      value={typeof value === 'string' ? value : ''}
      {required}
      oninput={(e) => onchange(e.currentTarget.value)}
    />
  </label>
{/if}

{#if error}
  <FieldError testid={`${testid}-error`} message={error} />
{/if}
