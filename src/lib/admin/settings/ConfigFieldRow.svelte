<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { describeConfigField, type ConfigFieldSchema } from '#lib/config/admin.ts';
  import type { ConfigMap, ConfigObject } from '#lib/config/resolve.ts';
  import { adminConfig, type AdminConfigKind } from '#lib/admin/settings/adminConfig.svelte.ts';
  import { humanizeKey } from '#lib/utils/strings.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { cardClass } from '#lib/ui/surface.ts';
  import { configValueError, serializeConfigValue } from './configValue.ts';
  import ConfigValueInput from './ConfigValueInput.svelte';
  import ExpandableText from './ExpandableText.svelte';
  import OriginBadge from './OriginBadge.svelte';

  interface Props {
    schema: ConfigFieldSchema;
    apiMap: ConfigMap;
    envMap: ConfigMap;
    apiAvailable: boolean;
    kind: AdminConfigKind;
    // Non-top-admins get read-only access: editing controls are disabled, but this
    // is distinct from rowDisabled (API unavailable), so the "API unavailable" badge
    // below stays accurate to its actual cause.
    readOnly?: boolean;
  }

  let { schema, apiMap, envMap, apiAvailable, kind, readOnly = false }: Props = $props();

  let label = $derived(humanizeKey(schema.name));

  let apiRow: ConfigObject | undefined = $derived(apiMap[schema.name]);
  let fieldOrigin = $derived(describeConfigField(schema.name, apiMap, envMap));
  let rowDisabled = $derived(!apiAvailable || fieldOrigin.disabled);
  let editDisabled = $derived(rowDisabled || readOnly);

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
  let error = $derived(configValueError(schema.type, value));

  let saving = $state(false);

  async function saveField() {
    if (saving) return;
    saving = true;
    try {
      const serialized = serializeConfigValue(schema.type, value);
      if (apiRow?.uuid) {
        await adminConfig.update(kind, { ...apiRow, value: serialized });
      } else {
        await adminConfig.add(kind, schema.name, serialized);
      }
      toaster.success({ title: `Saved ${label}` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to save ${label}` });
    } finally {
      saving = false;
    }
  }

  async function resetField() {
    if (!apiRow?.uuid) return;
    try {
      await adminConfig.remove(kind, apiRow.uuid);
      toaster.success({ title: `Reset ${label} to default` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to reset ${label}` });
    }
  }
</script>

<div
  class="{cardClass} border bg-white border-surface-200-800 rounded-xl p-5 shadow-sm {editDisabled
    ? 'opacity-55'
    : ''}"
  data-testid={`admin-config-field-row-${schema.name}`}
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
        <ExpandableText name={schema.name} text={schema.description} />
      {/if}
    </div>

    <div class="min-w-0">
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <OriginBadge name={schema.name} origin={fieldOrigin.origin} {resolvedValue} />
        {#if rowDisabled}
          <span class="text-xs italic opacity-60">API unavailable</span>
        {/if}
      </div>

      <ConfigValueInput
        name={schema.name}
        type={schema.type}
        bind:value
        disabled={editDisabled}
        {error}
      />

      <div class="flex items-center gap-3.5 mt-3 min-h-[28px]">
        {#if dirty}
          <Button
            size="sm"
            data-testid={`admin-config-field-save-${schema.name}`}
            disabled={editDisabled || !!error || saving}
            onclick={saveField}
          >
            Save
          </Button>
        {/if}
        {#if apiRow?.uuid}
          <button
            type="button"
            class="text-xs font-semibold opacity-70 hover:opacity-100 hover:underline"
            data-testid={`admin-config-field-reset-${schema.name}`}
            disabled={editDisabled}
            onclick={resetField}
          >
            Reset to default
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>
