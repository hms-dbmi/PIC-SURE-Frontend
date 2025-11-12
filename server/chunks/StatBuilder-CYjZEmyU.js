import { f as features, b as branding } from './configuration-wjj69jIJ.js';
import '@sveltejs/kit';
import './User-CGCqDR6a.js';
import './index2-DXnmzf54.js';
import './Dictionary-SO9EnU4C.js';
import './Filter-D4fknGLB.js';
import './Export-BN3JIXjt.js';

const PLUS_MINUS = "±";
function parseCount(count) {
  let value;
  let suffix;
  if (String(count).startsWith("<")) {
    suffix = 3;
    value = 0;
  } else {
    const [rawValue, rawSuffix] = String(count).split(PLUS_MINUS);
    value = parseInt(rawValue.replaceAll(",", "")) || 0;
    suffix = parseInt(rawSuffix ?? "") || 0;
  }
  return { value, suffix };
}
function normalizeCounts(countInput) {
  return countInput.flatMap((x) => typeof x === "object" ? Object.values(x) : x);
}
function countResult(results, asString = true) {
  const counts = normalizeCounts(results);
  if (counts.length === 0) return !features.federated ? void 0 : asString ? "0" : 0;
  if (counts.length === 1 && counts[0]?.toString().startsWith("<")) return counts[0];
  const parsed = counts.map(parseCount);
  const total = parsed.reduce((sum, { value }) => value > 0 ? sum + value : sum, 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);
  if (!asString) return total;
  return maxSuffix > 0 ? `${total.toLocaleString()}${PLUS_MINUS}${maxSuffix}` : total.toLocaleString();
}
const StatPromise = {
  list: (stat) => Object.entries(stat.result).map(([resourceName, promise]) => ({
    promise,
    resourceName
  })),
  rejected: (result) => result.status === "rejected",
  fullfiled: (result) => result.status === "fulfilled",
  valueOrZero: (result) => result.status === "fulfilled" ? result.value : 0
};
function getStatFields(key) {
  const statKeys = branding?.statFields ? Object.keys(branding?.statFields) : [];
  return statKeys.includes(key) ? branding?.statFields[key] : [];
}

export { StatPromise as S, countResult as c, getStatFields as g };
//# sourceMappingURL=StatBuilder-CYjZEmyU.js.map
