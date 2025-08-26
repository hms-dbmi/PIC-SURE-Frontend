import './index2-CvuFLVuQ.js';
import './User-ByrNDeqq.js';
import './client-BWx-wafP.js';
import { b as branding } from './configuration-CSskKBur.js';
import './Dictionary-10axK71X.js';
import './Filter-BUwQwcV6.js';
import './Export-CTQ_v_3l.js';

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
  if (counts.length === 0) return asString ? "0" : 0;
  if (counts.length === 1 && counts[0].toString().startsWith("<")) return counts[0];
  const parsed = counts.map(parseCount);
  const total = parsed.reduce((sum, { value }) => value > 0 ? sum + value : sum, 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);
  if (!asString) return total;
  return maxSuffix > 0 ? `${total.toLocaleString()}${PLUS_MINUS}${maxSuffix}` : total.toLocaleString();
}
const StatPromise = {
  list: (stat) => Object.values(stat.result),
  rejected: (result) => result.status === "rejected",
  fullfiled: (result) => result.status === "fulfilled",
  valueOrZero: (result) => result.status === "fulfilled" ? result.value : 0
};
function getStatFields(key) {
  const statKeys = branding?.statFields ? Object.keys(branding?.statFields) : [];
  return statKeys.includes(key) ? branding?.statFields[key] : [];
}

export { StatPromise as S, countResult as c, getStatFields as g };
//# sourceMappingURL=StatBuilder-Dl1Zy-p_.js.map
