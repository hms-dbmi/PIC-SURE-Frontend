export type ExpectedResultType =
  | 'COUNT'
  | 'CROSS_COUNT'
  | 'OBSERVATION_CROSS_COUNT'
  | 'DATAFRAME'
  | 'DATAFRAME_PFB'
  | 'DATAFRAME_TIMESERIES'
  | 'AGGREGATE_VCF_EXCERPT'
  | 'VCF_EXCERPT'
  | 'VARIANT_COUNT_FOR_QUERY'
  | 'SECRET_ADMIN_DATAFRAME';

type UUID = `${string}-${string}-${string}-${string}-${string}` | null;
export type PhenotypicFilterType = 'REQUIRED' | 'FILTER' | 'ANY_RECORD_OF';
export type PhenotypicClause = PhenotypicSubquery | PhenotypicFilter;
export const Operator = {
  AND: 'AND',
  OR: 'OR',
} as const;
export type OperatorType = (typeof Operator)[keyof typeof Operator];

export interface Query {
  select: string[];
  authorizationFilters: AuthorizationFilter[];
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicClause[];
  expectedResultType: ExpectedResultType;
  picsureId: UUID;
  id: UUID;
}

export interface AuthorizationFilter {
  conceptPath: string;
  values: string[];
}

export interface PhenotypicFilter {
  type: 'PhenotypicFilter';
  phenotypicFilterType: PhenotypicFilterType;
  conceptPath: string;
  values?: string[];
  min?: number | undefined;
  max?: number | undefined;
  not: boolean;
}

export interface PhenotypicSubquery {
  type: 'PhenotypicSubquery';
  not: boolean | null;
  phenotypicClauses: PhenotypicClause[];
  operator: OperatorType;
}

export interface GenomicClause {
  key: string;
  values?: string[];
  min?: number;
  max?: number;
}

// The wire form has no `type` tags (the backend tells a subquery from a filter by its fields),
// and JSON drops undefined fields.
export type PhenotypicFilterJson = Omit<PhenotypicFilter, 'type'>;
export type PhenotypicSubqueryJson = Omit<PhenotypicSubquery, 'type' | 'phenotypicClauses'> & {
  phenotypicClauses: PhenotypicClauseJson[];
};
export type PhenotypicClauseJson = PhenotypicFilterJson | PhenotypicSubqueryJson;
export type QueryJson = Omit<Query, 'phenotypicClause'> & {
  phenotypicClause: PhenotypicClauseJson | null;
};

export function createQuery(fields: Partial<Query> = {}): Query {
  return {
    select: fields.select || [],
    authorizationFilters: fields.authorizationFilters || [],
    phenotypicClause: fields.phenotypicClause || null,
    genomicFilters: fields.genomicFilters || [],
    expectedResultType: fields.expectedResultType || 'COUNT',
    picsureId: fields.picsureId || null,
    id: fields.id || null,
  };
}

export function queryLeaves(query: Pick<Query, 'phenotypicClause'>): PhenotypicFilter[] {
  const getLeaves = (node: PhenotypicClause): PhenotypicFilter[] =>
    node.type === 'PhenotypicSubquery' ? node.phenotypicClauses.flatMap(getLeaves) : [node];
  return query.phenotypicClause ? getLeaves(query.phenotypicClause) : [];
}

/**
 * Appends `clauses` to a root clause without mutating it: a lone filter becomes a
 * `defaultOperator` group of itself and the first clause; a group gains them as children.
 */
export function appendClauses(
  root: PhenotypicClause | null,
  clauses: PhenotypicClause[],
  defaultOperator: OperatorType = Operator.AND,
): PhenotypicClause | null {
  return clauses.reduce<PhenotypicClause | null>((current, clause) => {
    if (current === null) return clause;
    if (current.type === 'PhenotypicFilter') {
      return {
        type: 'PhenotypicSubquery',
        phenotypicClauses: [current, clause],
        operator: defaultOperator,
        not: false,
      };
    }
    return { ...current, phenotypicClauses: [...current.phenotypicClauses, clause] };
  }, root);
}

/** Strips the `type` tags and undefined fields, as the backend expects. */
export function toQueryJson(query: Query): QueryJson {
  return JSON.parse(JSON.stringify(query, (key, value) => (key === 'type' ? undefined : value)));
}

// The API echoes saved queries back with every field present, so unset bounds and
// value lists arrive as explicit `null`. Downstream code only tests for `undefined`.
function undefinedIfNull<T>(value: unknown): T | undefined {
  return value === null ? undefined : (value as T);
}

function parseClause(clause: Record<string, unknown>): PhenotypicClause {
  if ('operator' in clause || 'phenotypicClauses' in clause) {
    return {
      type: 'PhenotypicSubquery',
      operator: clause.operator as OperatorType,
      not: (clause.not as boolean) ?? false,
      phenotypicClauses: ((clause.phenotypicClauses as Record<string, unknown>[]) || []).map(
        parseClause,
      ),
    };
  }
  return {
    type: 'PhenotypicFilter',
    phenotypicFilterType: clause.phenotypicFilterType as PhenotypicFilterType,
    conceptPath: clause.conceptPath as string,
    not: (clause.not as boolean) ?? false,
    values: undefinedIfNull<string[]>(clause.values),
    min: undefinedIfNull<number>(clause.min),
    max: undefinedIfNull<number>(clause.max),
  };
}

function parseGenomicClause(filter: GenomicClause): GenomicClause {
  return {
    key: filter.key,
    values: undefinedIfNull<string[]>(filter.values),
    min: undefinedIfNull<number>(filter.min),
    max: undefinedIfNull<number>(filter.max),
  };
}

export interface SavedQuery {
  select?: string[];
  authorizationFilters?: AuthorizationFilter[];
  phenotypicClause?: object | null;
  genomicFilters?: GenomicClause[];
  expectedResultType?: ExpectedResultType;
  picsureId?: UUID;
  id?: UUID;
}

/** Restores the `type` tags of a query that went over the wire (a saved dataset's query). */
export function parseQuery(data: SavedQuery): Query {
  return createQuery({
    select: data.select || [],
    authorizationFilters: data.authorizationFilters || [],
    phenotypicClause: data.phenotypicClause
      ? parseClause(data.phenotypicClause as Record<string, unknown>)
      : null,
    genomicFilters: (data.genomicFilters || []).map(parseGenomicClause),
    expectedResultType: data.expectedResultType || 'COUNT',
    picsureId: data.picsureId ?? null,
    id: data.id ?? null,
  });
}
