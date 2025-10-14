import { Operator } from '$lib/models/query/Query';

export class FilterClause {
  uuid: string;

  constructor(uuid: string) {
    this.uuid = uuid;
  }

  get toString(): string {
    return this.uuid;
  }
}

export class GroupClause {
  operator: Operator;
  clauses: Clause[];

  constructor(operator: Operator, clauses: Clause[] = []) {
    this.clauses = clauses;
    this.operator = operator;
  }

  get toString(): string {
    return (
      '{operator:' +
      this.operator +
      ';clauses:[' +
      this.clauses.map((c) => c.toString).join(',') +
      ']}'
    );
  }
}

export type Clause = FilterClause | GroupClause;

export class FlatFilterTree {
  filters: string[];
  operators: Operator[];

  constructor(filters: string[] = []) {
    this.filters = filters;
    this.operators = filters.length > 1 ? Array(filters.length - 1).fill(Operator.AND) : [];
  }

  add(uuid: string) {
    if (this.filters.length >= 1) {
      this.operators.push(Operator.AND);
    }
    this.filters.push(uuid);
  }

  remove(uuid: string) {
    const index = this.filters.findIndex((f) => f === uuid);

    if (this.operators.length > 0) {
      if (index === 0) {
        this.operators.splice(0, 1);
      } else if (index === this.filters.length - 1) {
        this.operators.splice(this.operators.length - 1, 1);
      } else {
        const leftOper = this.operators[index - 1];
        if (leftOper === Operator.OR) {
          this.operators.splice(index - 1, 1);
        } else {
          this.operators.splice(index, 1);
        }
      }
    }

    this.filters.splice(index, 1);
  }

  swap(a: string, operator: Operator, b: string) {
    const iA = this.filters.findIndex((f) => f === a);
    const iB = this.filters.findIndex((f) => f === b);

    if (iA < 0 || iB < 0 || Math.abs(iA - iB) !== 1) return;

    this.operators.splice(iA < iB ? iA : iB, 1, operator);
  }

  get clauseTree(): GroupClause {
    if (this.operators.length === 0) {
      return new GroupClause(
        Operator.AND,
        this.filters.length === 1 ? [new FilterClause(this.filters[0])] : [],
      );
    }

    const root: GroupClause = new GroupClause(this.operators[0]);
    let currentClause = root;
    this.operators.forEach((operator, index) => {
      const clause = new FilterClause(this.filters[index]);
      if (operator !== currentClause.operator) {
        // push to OR group before switching to an AND group
        if (operator === Operator.AND) {
          currentClause.clauses.push(clause);
          currentClause = root;
        } else {
          const newClause = new GroupClause(Operator.OR);
          root.clauses.push(newClause);
          currentClause = newClause;
          currentClause.clauses.push(clause);
        }
      } else {
        currentClause.clauses.push(clause);
      }
    });

    // Add last filter
    currentClause.clauses.push(new FilterClause(this.filters[this.filters.length - 1]));

    return root;
  }

  get toString(): string {
    return this.filters
      .map((f, i) => {
        return i === 0 ? f : this.operators[i - 1] + ' ' + f;
      })
      .join(' ');
  }
}
