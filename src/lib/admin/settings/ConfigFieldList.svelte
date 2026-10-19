<script lang="ts" module>
  import type { ConfigFieldSchema } from '#lib/config/admin.ts';
  import type { AdminConfigKind } from '#lib/admin/settings/adminConfig.svelte.ts';

  /** A schema field and the kind whose admin API stores it. */
  export type KindedField = ConfigFieldSchema & { kind: AdminConfigKind };
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { groupedConfigFieldSchema } from '#lib/config/admin.ts';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import { humanizeKey } from '#lib/utils/strings.ts';

  const SEARCH_BOX_MIN_LENGTH = 10;

  interface Props {
    fields: KindedField[];
    testIdBase: string;
    field: Snippet<[KindedField]>;
    /** Tab-level controls, shown at the end of the search row. */
    actions: Snippet;
  }

  let { fields, testIdBase, field, actions }: Props = $props();

  // Sections group fields by relation (e.g. Google settings, or a feature flag together
  // with the settings that configure it) rather than by type or kind - see
  // groupedConfigFieldSchema. Headers are only worth showing once there's more than one
  // section (Branding currently has a single "Logo" group).
  let groups = $derived(groupedConfigFieldSchema(fields));
  let showGroupHeaders = $derived(groups.length > 1);

  let query = $state('');
  let normalizedQuery = $derived(query.trim().toLowerCase());
  let filteredGroups = $derived.by(() => {
    if (!normalizedQuery) return groups;
    return groups
      .map((g) => ({
        ...g,
        fields: g.fields.filter((f) =>
          `${humanizeKey(f.name)} ${f.name} ${f.description} ${g.groupLabel}`
            .toLowerCase()
            .includes(normalizedQuery),
        ),
      }))
      .filter((g) => g.fields.length > 0);
  });
  let visibleCount = $derived(filteredGroups.reduce((sum, g) => sum + g.fields.length, 0));
</script>

<div class="flex items-center gap-3 my-3">
  {#if fields.length > SEARCH_BOX_MIN_LENGTH}
    <SearchInput
      class="w-full max-w-sm flex-1"
      placeholder="Search fields…"
      label="Search fields"
      data-testid={`admin-config-search-${testIdBase}`}
      bind:value={query}
    />
    <span class="text-xs opacity-60 whitespace-nowrap">
      {visibleCount} of {fields.length} fields
    </span>
  {/if}
  <div class="flex-1"></div>
  {@render actions()}
</div>
<div data-testid={`admin-config-tab-${testIdBase}`}>
  {#each filteredGroups as group (group.group)}
    <div class="mb-8" data-testid={`admin-config-group-${testIdBase}-${group.group}`}>
      {#if showGroupHeaders}
        <div
          class="text-[13px] font-bold uppercase tracking-wide opacity-70 border-b border-surface-200-800 pb-2 mb-3.5"
        >
          {group.groupLabel}
        </div>
      {/if}
      <div class="flex flex-col gap-2.5">
        {#each group.fields as item (`${item.kind}:${item.name}`)}
          {@render field(item)}
        {/each}
      </div>
    </div>
  {/each}
  {#if filteredGroups.length === 0}
    <p
      class="text-center text-sm opacity-60 py-10"
      data-testid={`admin-config-no-results-${testIdBase}`}
    >
      No fields match &ldquo;{query}&rdquo;.
    </p>
  {/if}
</div>
