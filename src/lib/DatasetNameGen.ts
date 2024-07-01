import { Query } from "./models/query/Query";

export function generateDatasetName(query: Query): string {
  let name = '';
  let countOfNames = 0;
  for (let key of Object.keys(query)) {
    let name = '';
    if (query[key as keyof Query] !== undefined || query[key as keyof Query] !== null || JSON.stringify(query[key as keyof Query]) !== '{}') {
      name += `${query[key as keyof Query]}&`;
      countOfNames++;
    } else {
      continue;
    }
    if (countOfNames >= 3 || name.length >= 25) {
      return name;
    }
  }
  if (name.length === 0) {
    return 'default';
  }
  return name;
}