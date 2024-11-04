import { d as derived, w as writable } from './index2-CV6P_ZFI.js';

const variantData = [
  {
    key: "High Severity",
    children: [
      "splice_acceptor_variant",
      "splice_donor_variant",
      "stop_gained",
      "frameshift_variant",
      "stop_lost",
      "start_lost"
    ]
  },
  {
    key: "Medium Severity",
    children: [
      "inframe_insertion",
      "inframe_deletion",
      "missense_variant",
      "protein_altering_variant"
    ]
  },
  {
    key: "Low Severity",
    children: [
      "splice_region_variant",
      "splice_donor_5th_base_variant",
      "splice_donor_region_variant",
      "splice_polypyrimidine_tract_variant",
      "incomplete_terminal_codon_variant",
      "start_retained_variant",
      "stop_retained_variant",
      "synonymous_variant"
    ]
  }
];
const severityKeys = variantData.map((sev) => sev.key);
const selectedGenes = writable([]);
const selectedFrequency = writable([]);
const selectedConsequence = writable([]);
const consequences = derived(
  selectedConsequence,
  ($c) => $c.filter((cons) => !severityKeys.includes(cons))
);
function clearGeneFilters() {
  selectedGenes.set([]);
  selectedFrequency.set([]);
  selectedConsequence.set([]);
}

export { selectedFrequency as a, selectedConsequence as b, clearGeneFilters as c, consequences as d, selectedGenes as s, variantData as v };
//# sourceMappingURL=GeneFilter-C5VcJAGK.js.map
