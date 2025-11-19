import { w as writable, l as get } from './utils-B7NzVBxP.js';
import { a6 as get$1, a4 as Picsure, u as user } from './User-01eW3TFo.js';
import './configuration-CBIXsjx2.js';

const open = writable(false);
const columns = writable([]);
const rows = writable([]);
const activeRow = writable({});
function fetchDashboard() {
  return get$1(Picsure.Dashboard);
}
async function loadDashboardData() {
  const dashboardData = await fetchDashboard();
  columns.set(dashboardData.columns);
  get(user);
  let consents = [];
  const processedRows = dashboardData.rows.map(processRow(consents));
  const sortedRows = processedRows.sort((a, b) => {
    const aIsAnvil = (a.program_name?.toString().toLowerCase() || "") === "anvil";
    const bIsAnvil = (b.program_name?.toString().toLowerCase() || "") === "anvil";
    if (aIsAnvil !== bIsAnvil) {
      return aIsAnvil ? 1 : -1;
    }
    if (a.consentGranted === b.consentGranted) {
      return sortByAbbreviation(a, b);
    }
    return a.consentGranted ? -1 : 1;
  });
  rows.set(sortedRows);
}
function processRow(consents) {
  return (row) => {
    if (!row.accession) {
      return { ...row, consentGranted: false };
    }
    const accession = row.accession.toString();
    const accessionRegex = /^phs\d+\.v\d+\.p\d+\.c\d+$/;
    if (accessionRegex.test(accession)) {
      const accessionBase = accession.replace(/\.v\d+\.p\d+/, "");
      return { ...row, consentGranted: consents.includes(accessionBase) };
    }
    return { ...row, consentGranted: consents.includes(accession) };
  };
}
function sortByAbbreviation(a, b) {
  const aAbbr = a.abbreviation?.toString() || "";
  const bAbbr = b.abbreviation?.toString() || "";
  return aAbbr.localeCompare(bAbbr);
}

export { activeRow as a, loadDashboardData as l, open as o };
//# sourceMappingURL=Dashboard-DcCMRJp3.js.map
