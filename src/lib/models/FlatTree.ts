import { type OperatorType, Operator } from '$lib/models/query/Query';

export class FlatFilterTree {
  filters: string[];
  operators: OperatorType[];

  constructor(filters: string[] = [], operators: OperatorType[] = []) {
    this.filters = filters;
    if (operators.length > 0) {
      this.operators = operators;
    } else {
      this.operators = filters.length > 1 ? Array(filters.length - 1).fill(Operator.AND) : [];
    }
  }

  add(...ids: string[]) {
    ids.forEach((id) => {
      if (this.filters.length >= 1) {
        this.operators.push(Operator.AND);
      }
      this.filters.push(id);
    });
  }

  remove(...ids: string[]) {
    ids.forEach((id) => {
      const index = this.filters.findIndex((f) => f === id);

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
    });
  }

  swap(a: string, operator: OperatorType, b: string) {
    const iA = this.filters.findIndex((f) => f === a);
    const iB = this.filters.findIndex((f) => f === b);

    if (iA < 0 || iB < 0 || Math.abs(iA - iB) !== 1) return;

    this.operators.splice(iA < iB ? iA : iB, 1, operator);
  }

  get toString(): string {
    return this.filters
      .map((f, i) => {
        return i === 0 ? f : this.operators[i - 1] + ' ' + f;
      })
      .join(' ');
  }
}
