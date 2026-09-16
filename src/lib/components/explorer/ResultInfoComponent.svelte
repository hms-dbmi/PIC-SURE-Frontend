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
   * Reads one of the design's fields out of the free-form `meta` bag.
   *
   * Keys are compared with case and punctuation removed rather than literally.
   * `concept_node_meta.key` is a `varchar(256)` filled per deployment by whatever loaded the
   * dictionary, its own seed data mixes `snake_case`, `space separated` and mixed case, and
   * `ConceptMetaExtractor` then title-cases each `_`-delimited word before we see it - so
   * `subject_type` arrives as "Subject Type" and `subjectType` as "SubjectType". One
   * normalising rule covers that; a literal comparison would need a per-deployment list.
   *
   * The aliases below are only the spellings the design itself uses (`prototype/js/data.js`:
   * `Accession`, `Subject Type`, `Vocabulary`, `Unit`, `harmonizationLink`, and the label
   * "Harmonization method(s)", which could be a singular or plural key). Nothing wider is
   * guessed at, because until the dictionary makes them first-class fields (SPEC section 8,
   * item 6) any deployment that has them has them under a key it chose itself.
   */
  function metaKey(key: string): string {
    return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  /**
   * The `[key, value]` the row should use, or `undefined` if the bag has nothing for it.
   *
   * Normalising is lossy, so two distinct raw keys can land on one alias. `concept_node_meta`
   * is unique on `(key, concept_node_id)`, but only on the *raw* key, and the keys are then
   * title-cased on the way out by `ConceptMetaExtractor` - a deployment holding both
   * `subject_type` and `subjectType` sends us "Subject Type" and "SubjectType", which
   * normalise onto the same `subjecttype`. Taking the first *match* let an empty spelling
   * hide a populated one and rendered the row blank. Precedence is therefore: alias order
   * first, then the first **populated** key among the raw keys that normalise onto it, in the
   * order the dictionary serialised the bag. Returning the key, not just the value, is what
   * lets the caller keep that entry from being listed a second time below.
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

  /**
   * Every populated key in a `meta` bag as its own row, minus the keys a labelled row above
   * already rendered - a value the design gives a label to should not also appear under its
   * raw dictionary key.
   */
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
   * Variable Information: the mockups' rows first, in the mockups' order with the mockups'
   * labels (`p1-04-asthma-detail.png`, `p1-10-eosinophil-detail.png`,
   * `p2-04-moderate-detail.png`), then whatever else the concept's `meta` bag holds, behind
   * the same Show More the Dataset and Study sections use.
   *
   * The designed rows do not replace the bag, for two reasons.
   *
   * The keys deployments populate are wider than these eight. The dictionary indexes
   * `description`, `derived_values`, `variable_type`, `comment`, `domain`,
   * `Question`/`question`, `unit` and `values` for search
   * (`WeightUpdateCreator`/`rebuild_searchable_fields.sql`) - `comment` and `Question` are
   * free text a curator wrote, and a fixed eight-row list renders them nowhere, because this
   * component is the only place in the application a concept's bag is rendered at all.
   *
   * And deciding what to hide is not ours to make. The dictionary filters the bag itself,
   * server side and per deployment, with the `metadata.no_show_list` denylist that
   * `ConceptRepository` applies as `key NOT IN (:noShowList)` - `values` on every profile,
   * plus `stigmatized`, `derived_values`, `drs_uri`, `logical_min`, `logical_max` and
   * `description` on BDC. What reaches us is what that deployment wants shown, so dropping
   * any of it here overrides a decision already taken upstream.
   *
   * Accession prefers a `meta` accession and otherwise falls back to `name`, which is the row
   * this page showed before the redesign. `name` is *not* a path segment, despite
   * `Concept.java` documenting it as "the right most concept in the concept path": `name` and
   * `concept_path` are independent columns and `ConceptResultSetUtil` maps `name` verbatim. On
   * the dictionary's own canonical dbGaP row (`seed.sql`, concept_node 232) `name` is
   * `phv00004260`, `display` is `FM219` and the path ends `\phv00004260\FM219\` - so `name`
   * is the dbGaP variable accession and `display` is the last segment. The JavaDoc holds only
   * for ACT/ICD-10 rows, where `name`, `display` and the last segment coincide.
   */
  function variableInfoRows(searchResultDetail: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    const meta = searchResultDetail.meta;
    // Raw keys a labelled row below takes its value from, so the bag does not repeat them.
    // An array rather than a `Set` because this is a plain local accumulator, and a `Set`
    // here trips `svelte/prefer-svelte-reactivity`, which wants a reactive collection.
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

  // Dataset and Study keep the fields and the `meta` bag they have today, in the single-column
  // treatment the variable list now uses. The mockups only redesign Variable Information, and
  // these two sections are the only place a study's link, phase and accession are on screen.
  // `table.name` under "Accession" is the same field, read the same way, as the variable row.
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
        <!-- `h2` for the document outline - the page's own heading is an `h1` and there is
             nothing between them - and `h5` for the size, which is the one the page's other
             section headings use. Without a size class an `h2` renders at 1.75rem, half again
             the size of the `h1.h4` above it. -->
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
