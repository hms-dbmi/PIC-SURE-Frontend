<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import ShowMoreButton from '$lib/components/buttons/ShowMoreButton.svelte';
  import { config } from '$lib/configuration.svelte';

  type InfoRow = {
    label: string;
    value: string;
    testid?: string;
    href?: string;
    isMeta?: boolean;
  };

  const MAX_INFO_ROWS = 10;

  let { data = {} as SearchResult }: { data?: SearchResult } = $props();

  let showAllVariableInfo = $state(false);
  let showAllDatasetInfo = $state(false);
  let showAllStudyInfo = $state(false);

  let detailPromise = $derived(getConceptDetails(data.conceptPath, data.dataset));

  function isPresent(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  function formatValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return String(value);
  }

  function addRow(
    rows: InfoRow[],
    label: string,
    value: unknown,
    options: Omit<InfoRow, 'label' | 'value'> = {},
  ): void {
    if (isPresent(value)) rows.push({ ...options, label, value: formatValue(value) });
  }

  /**
   * Meta keys are deployment-supplied and inconsistently spelled - the dictionary
   * title-cases each `_`-delimited word on the way out, so `subject_type` arrives as
   * "Subject Type" and `subjectType` as "SubjectType". Compared with case and punctuation
   * stripped, because a literal comparison would need a per-deployment list.
   */
  function metaKey(key: string): string {
    return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  /**
   * Normalising is lossy, so two raw keys can land on one alias. Precedence: alias order
   * first, then the first *populated* raw key that normalises onto it. Returning the key
   * lets the caller suppress that entry from the raw bag below.
   */
  function metaEntry(
    meta: Record<string, unknown> | null | undefined,
    aliases: string[],
  ): [string, unknown] | undefined {
    const entries = Object.entries(meta ?? {});
    for (const alias of aliases) {
      const found = entries.find(([key, value]) => metaKey(key) === alias && isPresent(value));
      if (found) return found;
    }
    return undefined;
  }

  // Already normalised by the rule in `metaKey`, so they carry no case or punctuation.
  const ACCESSION_KEYS = ['accession'];
  const UNIT_KEYS = ['unit'];
  const SUBJECT_TYPE_KEYS = ['subjecttype'];
  const VOCABULARY_KEYS = ['vocabulary'];
  const HARMONIZATION_KEYS = ['harmonizationmethods', 'harmonizationmethod', 'harmonizationlink'];

  /**
   * `meta` values are untrusted dictionary data, so only an absolute http(s) URL becomes
   * an `href`; anything else renders as text. Interpolating directly would run a
   * `javascript:` value in the user's session.
   */
  function safeLink(value: string): string | undefined {
    try {
      const { protocol } = new URL(value);
      return protocol === 'http:' || protocol === 'https:' ? value : undefined;
    } catch {
      return undefined;
    }
  }

  function getMetaRows(
    meta: Record<string, unknown> | null | undefined,
    shown: readonly string[] = [],
  ): InfoRow[] {
    return Object.entries(meta ?? {}).reduce((rows, [label, value]) => {
      if (!shown.includes(label)) addRow(rows, label, value, { isMeta: true });
      return rows;
    }, [] as InfoRow[]);
  }

  function getVisibleRows(rows: InfoRow[], showAll: boolean): InfoRow[] {
    return showAll ? rows : rows.slice(0, MAX_INFO_ROWS);
  }

  /**
   * Accession prefers a `meta` accession and falls back to `name`. `name` is *not* the
   * last concept-path segment, despite `Concept.java` documenting it that way: on dbGaP
   * rows `name` is the variable accession (`phv00004260`) and `display` is the last
   * segment (`FM219`). The two coincide only on ACT/ICD-10 rows.
   */
  function variableInfoRows(searchResultDetail: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    const meta = searchResultDetail.meta;
    // An array, not a `Set`: a `Set` here trips `svelte/prefer-svelte-reactivity`.
    const shownMetaKeys: string[] = [];

    function fromMeta(aliases: string[]): unknown {
      const entry = metaEntry(meta, aliases);
      if (!entry) return undefined;
      shownMetaKeys.push(entry[0]);
      return entry[1];
    }

    const accession = fromMeta(ACCESSION_KEYS) ?? searchResultDetail.name;
    const unit = fromMeta(UNIT_KEYS);
    const subjectType = fromMeta(SUBJECT_TYPE_KEYS);
    const vocabulary = fromMeta(VOCABULARY_KEYS);
    const harmonization = fromMeta(HARMONIZATION_KEYS);

    addRow(rows, 'Name', searchResultDetail.display, { testid: 'variable-info-name' });
    addRow(rows, 'Description', searchResultDetail.description, {
      testid: 'variable-info-description',
    });
    addRow(rows, 'Accession', accession, { testid: 'variable-info-accession' });
    addRow(rows, 'Type', searchResultDetail.type, { testid: 'variable-info-type' });
    addRow(rows, 'Unit', unit, { testid: 'variable-info-unit' });
    addRow(rows, 'Subject Type', subjectType, { testid: 'variable-info-subject-type' });
    addRow(rows, 'Vocabulary', vocabulary, { testid: 'variable-info-vocabulary' });
    addRow(rows, 'Harmonization method(s)', harmonization, {
      testid: 'variable-info-harmonization-methods',
      href: isPresent(harmonization) ? safeLink(formatValue(harmonization)) : undefined,
    });

    return [...rows, ...getMetaRows(meta, shownMetaKeys)];
  }

  function datasetInfoRows(table: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    addRow(rows, 'Name', table.display);
    addRow(rows, 'Accession', table.name);
    addRow(rows, 'Description', table.description);
    return [...rows, ...getMetaRows(table.meta)];
  }

  function studyInfoRows(searchResultDetail: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    const study = searchResultDetail.study;
    addRow(
      rows,
      'Study Name',
      study?.fullName || study?.display || study?.studyAcronym || searchResultDetail.studyAcronym,
    );
    addRow(rows, 'Study Accession', study?.ref);
    return [...rows, ...getMetaRows(study?.meta)];
  }
</script>

{#snippet infoRows(rows: InfoRow[])}
  <div class="w-full flex flex-col gap-y-1">
    {#each rows as row}
      <div class="min-w-0 break-words" data-testid={row.testid}>
        <span class="font-bold" class:capitalize={row.isMeta}>{row.label}:</span>
        {#if row.href}
          <!-- Not a route, so `resolve()` does not apply: `safeLink` has already restricted
               this to an absolute http(s) URL out of the dictionary's metadata. -->
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a class="anchor break-all" href={row.href} target="_blank" rel="noopener noreferrer">
            {row.value}
          </a>
        {:else}
          <span>{row.value}</span>
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

<div class="card bg-surface-100 min-h-60 p-4">
  <div class="card-body">
    {#await detailPromise}
      <Loading ring size="medium" />
    {:then searchResultDetail}
      {@const variableRows = variableInfoRows(searchResultDetail)}
      <section data-testid="variable-info" class="flex flex-col w-full p-4">
        <h2 class="h5 text-primary-500">
          {config.branding.explorePage.resultInfo.variableHeader || 'Variable Information'}
        </h2>
        {@render infoRows(getVisibleRows(variableRows, showAllVariableInfo))}
        {#if variableRows.length > MAX_INFO_ROWS}
          <ShowMoreButton
            data-testid="show-more-variable-info"
            expanded={showAllVariableInfo}
            onclick={() => (showAllVariableInfo = !showAllVariableInfo)}
          />
        {/if}
      </section>
      {#if searchResultDetail.table}
        {@const datasetRows = datasetInfoRows(searchResultDetail.table)}
        <section data-testid="dataset-info" class="flex flex-col w-full p-4">
          <h2 class="h5 text-primary-500">
            {config.branding.explorePage.resultInfo.datasetHeader || 'Dataset Information'}
          </h2>
          {@render infoRows(getVisibleRows(datasetRows, showAllDatasetInfo))}
          {#if datasetRows.length > MAX_INFO_ROWS}
            <ShowMoreButton
              data-testid="show-more-dataset-info"
              expanded={showAllDatasetInfo}
              onclick={() => (showAllDatasetInfo = !showAllDatasetInfo)}
            />
          {/if}
        </section>
      {/if}
      {#if searchResultDetail.study}
        {@const studyRows = studyInfoRows(searchResultDetail)}
        <section data-testid="study-info" class="flex flex-col w-full p-4">
          <h2 class="h5 text-primary-500">
            {config.branding.explorePage.resultInfo.studyHeader || 'Study Information'}
          </h2>
          {@render infoRows(getVisibleRows(studyRows, showAllStudyInfo))}
          {#if studyRows.length > MAX_INFO_ROWS}
            <ShowMoreButton
              data-testid="show-more-study-info"
              expanded={showAllStudyInfo}
              onclick={() => (showAllStudyInfo = !showAllStudyInfo)}
            />
          {/if}
        </section>
      {/if}
    {:catch}
      <ErrorAlert
        data-testid="variable-info-error"
        title="We could not load this variable's information"
      >
        <p class="m-0">
          Something went wrong reaching the data dictionary. Try again in a moment; if the problem
          persists, please contact an administrator.
        </p>
      </ErrorAlert>
    {/await}
  </div>
</div>
