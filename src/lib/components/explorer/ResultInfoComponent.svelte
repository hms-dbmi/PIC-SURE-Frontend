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
    /** Set on the variable list only, so the e2e suite can assert which rows and in what order. */
    testid?: string;
    /** Rendered as an anchor when set - see `safeLink`. */
    href?: string;
    /** A key out of the free-form `meta` bag rather than a field we label ourselves. */
    isMeta?: boolean;
  };

  const MAX_INFO_ROWS = 10;

  let { data = {} as SearchResult }: { data?: SearchResult } = $props();

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
   * Reads one of the design's fields out of the free-form `meta` bag.
   *
   * Keys are compared with case and punctuation removed rather than literally.
   * `concept_node_meta.key` is a `varchar(256)` filled per deployment by whatever loaded the
   * dictionary, and the keys in the dictionary's own seed data are a mix of `snake_case`,
   * `space separated` and mixed case - `Question` and `question` are *both* whitelisted in its
   * `rebuild_searchable_fields.sql`. One normalising rule covers that; a literal comparison
   * would need a per-deployment list.
   *
   * The aliases below are only the spellings the design itself uses (`prototype/js/data.js`:
   * `Accession`, `Subject Type`, `Vocabulary`, `Unit`, `harmonizationLink`, and the label
   * "Harmonization method(s)", which could be a singular or plural key). Nothing wider is
   * guessed at, because none of these keys exist in any fixture, in `mock-data.ts`, or in the
   * dictionary's seed data: until the dictionary makes them first-class fields (SPEC section 8,
   * item 6) these rows are simply absent, which is what the omit-empty rule is for.
   */
  function metaKey(key: string): string {
    return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  function metaValue(meta: Record<string, unknown> | null | undefined, aliases: string[]): unknown {
    const entries = Object.entries(meta ?? {});
    for (const alias of aliases) {
      const found = entries.find(([key]) => metaKey(key) === alias);
      if (found && isPresent(found[1])) return found[1];
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
   * An `href` for a meta value, or `undefined` if it should stay text.
   *
   * Harmonization method(s) is the one row the design renders as a link, and its value is
   * dictionary data rather than anything this component controls. An `href` interpolated
   * straight from that would run a `javascript:` value on click, in the user's session - so
   * anything that is not http(s) is rendered as the text it is.
   */
  function safeLink(value: string): string | undefined {
    try {
      const { protocol } = new URL(value);
      return protocol === 'http:' || protocol === 'https:' ? value : undefined;
    } catch {
      return undefined;
    }
  }

  function getMetaRows(meta: Record<string, unknown> | null | undefined): InfoRow[] {
    return Object.entries(meta ?? {}).reduce((rows, [label, value]) => {
      addRow(rows, label, value, { isMeta: true });
      return rows;
    }, [] as InfoRow[]);
  }

  function getVisibleRows(rows: InfoRow[], showAll: boolean): InfoRow[] {
    return showAll ? rows : rows.slice(0, MAX_INFO_ROWS);
  }

  /**
   * Variable Information, in the mockups' order with the mockups' labels
   * (`p1-04-asthma-detail.png`, `p1-10-eosinophil-detail.png`, `p2-04-moderate-detail.png`).
   *
   * A fixed list, not the typed fields plus everything in `meta`: the mockups show these rows
   * and no others, and the bag they used to be appended from carries `values`, `stigmatized`,
   * `unique_identifier` and `free_text` on real data.
   *
   * Accession is read from `meta`, and is *not* the old `name` row relabelled. The dictionary
   * defines `name` as "the right most concept in the concept path"
   * (`Concept.java`) - a path segment - while the design's accessions are ontology
   * identifiers from three different namespaces (`MONDO:004979`, `OBA:VT0002602`,
   * `rc-ra1:cc_asthma_fu|inf|v33`). Labelling a path segment "Accession" said something
   * untrue about the data, so it is gone rather than carried over.
   */
  function variableInfoRows(searchResultDetail: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    const meta = searchResultDetail.meta;
    const harmonization = metaValue(meta, HARMONIZATION_KEYS);

    addRow(rows, 'Name', searchResultDetail.display, { testid: 'variable-info-name' });
    addRow(rows, 'Description', searchResultDetail.description, {
      testid: 'variable-info-description',
    });
    addRow(rows, 'Accession', metaValue(meta, ACCESSION_KEYS), {
      testid: 'variable-info-accession',
    });
    addRow(rows, 'Type', searchResultDetail.type, { testid: 'variable-info-type' });
    addRow(rows, 'Unit', metaValue(meta, UNIT_KEYS), { testid: 'variable-info-unit' });
    addRow(rows, 'Subject Type', metaValue(meta, SUBJECT_TYPE_KEYS), {
      testid: 'variable-info-subject-type',
    });
    addRow(rows, 'Vocabulary', metaValue(meta, VOCABULARY_KEYS), {
      testid: 'variable-info-vocabulary',
    });
    addRow(rows, 'Harmonization method(s)', harmonization, {
      testid: 'variable-info-harmonization-methods',
      href: isPresent(harmonization) ? safeLink(formatValue(harmonization)) : undefined,
    });

    return rows;
  }

  // Dataset and Study keep the fields and the `meta` bag they have today, in the single-column
  // treatment the variable list now uses. The mockups only redesign Variable Information, and
  // these two sections are the only place a study's link, phase and accession are on screen.
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
      <section data-testid="variable-info" class="flex flex-col w-full p-4">
        <h2 class="text-primary-500">
          {config.branding.explorePage.resultInfo.variableHeader || 'Variable Information'}
        </h2>
        {@render infoRows(variableInfoRows(searchResultDetail))}
      </section>
      {#if searchResultDetail.table}
        {@const datasetRows = datasetInfoRows(searchResultDetail.table)}
        <section data-testid="dataset-info" class="flex flex-col w-full p-4">
          <h2 class="text-primary-500">
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
          <h2 class="text-primary-500">
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
      <!-- Without this branch a rejected promise leaves the spinner above on screen for good.
           This component fetches the concept itself, and its callers reach it with whatever
           they hold: `getConceptDetails(undefined, undefined)` throws inside
           `conceptPath.replace`. A spinner that never stops reads as a slow network, so users
           wait instead of retrying or reporting it. -->
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
