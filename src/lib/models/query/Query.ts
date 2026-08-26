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

// -------------------------------- V3 Query -------------------------------- //

type UUID = `${string}-${string}-${string}-${string}-${string}` | null;
export type PhenotypicFilterType = 'REQUIRED' | 'FILTER' | 'ANY_RECORD_OF';
export type PhenotypicClause = PhenotypicSubqueryInterface | PhenotypicFilterInterface;
export const Operator = {
  AND: 'AND',
  OR: 'OR',
} as const;
export type OperatorType = (typeof Operator)[keyof typeof Operator];

export interface QueryInterfaceV3 {
  select: string[];
  authorizationFilters: AuthorizationFilterInterface[];
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicFilterInterfacev3[];
  expectedResultType: ExpectedResultType;
  picsureId: UUID;
  id: UUID;
}

export interface PhenotypicClauseInterface {
  type: string;
}
export interface AuthorizationFilterInterface {
  conceptPath: string;
  values: string[];
}

export interface PhenotypicFilterInterface extends PhenotypicClauseInterface {
  type: 'PhenotypicFilter';
  phenotypicFilterType: PhenotypicFilterType;
  conceptPath: string;
  values?: string[];
  min?: number | undefined;
  max?: number | undefined;
  not: boolean;
}

export interface PhenotypicSubqueryInterface extends PhenotypicClauseInterface {
  type: 'PhenotypicSubquery';
  not: boolean | null;
  phenotypicClauses: PhenotypicClause[];
  operator: OperatorType;
}

export interface GenomicFilterInterfacev3 {
  key: string;
  values?: string[];
  min?: number;
  max?: number;
}

// The API echoes saved queries back with every field present, so unset bounds and
// value lists arrive as explicit `null`. Downstream code only tests for `undefined`.
function undefinedIfNull<T>(value: unknown): T | undefined {
  return value === null ? undefined : (value as T);
}

export class QueryV3 implements QueryInterfaceV3 {
  select: string[];
  authorizationFilters: AuthorizationFilterInterface[];
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicFilterInterfacev3[];
  expectedResultType: ExpectedResultType;
  picsureId: UUID;
  id: UUID;

  constructor(newQuery?: QueryInterfaceV3) {
    this.select = newQuery?.select || [];
    this.authorizationFilters = newQuery?.authorizationFilters || [];
    this.phenotypicClause = newQuery?.phenotypicClause || null;
    this.genomicFilters = newQuery?.genomicFilters || [];
    this.expectedResultType = newQuery?.expectedResultType || 'COUNT';
    this.picsureId = newQuery?.picsureId || null;
    this.id = newQuery?.id || null;
  }

  get leaves(): PhenotypicFilterInterface[] {
    const getLeaves = (node: PhenotypicClause): PhenotypicFilterInterface[] => {
      if (node.type === 'PhenotypicSubquery') {
        return node.phenotypicClauses.flatMap((child) => getLeaves(child));
      }

      return [node];
    };
    return this.phenotypicClause ? getLeaves(this.phenotypicClause) : [];
  }

  addClauses(clauses: PhenotypicClause[], defaultOperator: OperatorType = Operator.AND) {
    clauses.forEach((clause: PhenotypicClause) => this.addClause(clause, defaultOperator));
  }

  addClause(clause: PhenotypicClause, defaultOperator: OperatorType = Operator.AND) {
    if (this.phenotypicClause === null) {
      this.phenotypicClause = clause;
    } else if (this.phenotypicClause.type === 'PhenotypicFilter') {
      this.phenotypicClause = {
        type: 'PhenotypicSubquery',
        phenotypicClauses: [this.phenotypicClause, clause],
        operator: defaultOperator,
        not: false,
      };
    } else if (this.phenotypicClause.type === 'PhenotypicSubquery') {
      this.phenotypicClause.phenotypicClauses = [
        ...(this.phenotypicClause.phenotypicClauses || []),
        clause,
      ];
    }
  }

  hasGenomicFilter(): boolean {
    return this.genomicFilters.length > 0;
  }

  hasFilter(): boolean {
    return (
      this.hasGenomicFilter() ||
      (this.phenotypicClause !== null &&
        ((this.phenotypicClause.type === 'PhenotypicSubquery' &&
          this.phenotypicClause.phenotypicClauses.length > 0) ||
          this.phenotypicClause.type === 'PhenotypicFilter'))
    );
  }

  private static deserializeClause(clause: Record<string, unknown>): PhenotypicClause {
    if ('operator' in clause || 'phenotypicClauses' in clause) {
      return {
        type: 'PhenotypicSubquery',
        operator: clause.operator as OperatorType,
        not: (clause.not as boolean) ?? false,
        phenotypicClauses: ((clause.phenotypicClauses as Record<string, unknown>[]) || []).map(
          QueryV3.deserializeClause,
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

  private static deserializeGenomicFilter(
    filter: GenomicFilterInterfacev3,
  ): GenomicFilterInterfacev3 {
    return {
      key: filter.key,
      values: undefinedIfNull<string[]>(filter.values),
      min: undefinedIfNull<number>(filter.min),
      max: undefinedIfNull<number>(filter.max),
    };
  }

  static fromSerialized(data: {
    select?: string[];
    authorizationFilters?: AuthorizationFilterInterface[];
    phenotypicClause?: object | null;
    genomicFilters?: GenomicFilterInterfacev3[];
    expectedResultType?: ExpectedResultType;
    picsureId?: UUID;
    id?: UUID;
  }): QueryV3 {
    return new QueryV3({
      select: data.select || [],
      authorizationFilters: data.authorizationFilters || [],
      phenotypicClause: data.phenotypicClause
        ? QueryV3.deserializeClause(data.phenotypicClause as Record<string, unknown>)
        : null,
      genomicFilters: (data.genomicFilters || []).map(QueryV3.deserializeGenomicFilter),
      expectedResultType: data.expectedResultType || 'COUNT',
      picsureId: data.picsureId ?? null,
      id: data.id ?? null,
    });
  }
}
