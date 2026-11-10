<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import type { ConfigObject } from '#lib/config/resolve.ts';
  import { adminConfig, type AdminConfigKind } from '#lib/admin/settings/adminConfig.svelte.ts';
  import { toaster } from '#lib/ui/toaster.ts';

  interface Entry {
    kind: AdminConfigKind;
    row: ConfigObject;
  }

  interface Props {
    entries: Entry[];
    /** The tab's title, named in the explanation. */
    title: string;
    /** Adds a Kind column, for tabs that cover more than one kind. */
    showKind: boolean;
    readOnly: boolean;
    testIdBase: string;
  }

  let { entries, title, showKind, readOnly, testIdBase }: Props = $props();

  const KIND_LABEL: Record<AdminConfigKind, string> = {
    features: 'Features',
    settings: 'Settings',
    branding: 'Branding',
  };

  async function remove({ kind, row }: Entry) {
    if (!row.uuid) return;
    try {
      await adminConfig.remove(kind, row.uuid);
      toaster.success({ title: `Deleted ${row.name}` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to delete ${row.name}` });
    }
  }
</script>

<div class="mt-6" data-testid={`admin-config-deprecated-${testIdBase}`}>
  <h3 class="font-semibold opacity-80 mb-1">Deprecated Keys</h3>
  <p class="text-xs opacity-60 mb-2">
    These stored values do not correspond to a known {title} field, so they are not read by the app under
    this kind. This includes genuinely unused keys, but also a key that was moved to a different kind
    - check the value before deleting.
  </p>
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        {#if showKind}
          <th>Kind</th>
        {/if}
        <th>Value</th>
        <th>Description</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each entries as entry (`${entry.kind}:${entry.row.uuid}`)}
        <tr data-testid={`admin-config-deprecated-row-${entry.row.name}`}>
          <td class="font-mono text-xs">{entry.row.name}</td>
          {#if showKind}
            <td class="text-xs opacity-70 capitalize">{KIND_LABEL[entry.kind]}</td>
          {/if}
          <td class="font-mono text-xs">{entry.row.value}</td>
          <td class="text-xs opacity-70">{entry.row.description ?? ''}</td>
          <td>
            <IconButton
              icon="fa-solid fa-trash fa-lg"
              label="Delete"
              data-testid={`admin-config-deprecated-delete-${entry.row.name}`}
              disabled={readOnly}
              onclick={() => remove(entry)}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
