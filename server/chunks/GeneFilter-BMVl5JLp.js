import { o as derived, w as writable, l as get } from './utils-Dn8W3aSK.js';
import './Filter-D4fknGLB.js';

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
function populateFromGeneFilter(filter) {
  selectedGenes.set(filter?.Gene_with_variant || []);
  selectedConsequence.set(filter?.Variant_consequence_calculated || []);
  selectedFrequency.set(filter?.Variant_frequency_as_text || []);
}
function clearGeneFilters() {
  selectedGenes.set([]);
  selectedFrequency.set([]);
  selectedConsequence.set([]);
}
function addConsquence(consequence) {
  selectedConsequence.set([...get(selectedConsequence), consequence]);
}
function removeConsequence(consequence) {
  const filtered = get(selectedConsequence).filter((cons) => cons !== consequence);
  selectedConsequence.set(filtered);
}

export { selectedConsequence as a, selectedFrequency as b, clearGeneFilters as c, consequences as d, addConsquence as e, populateFromGeneFilter as p, removeConsequence as r, selectedGenes as s, variantData as v };
//# sourceMappingURL=GeneFilter-BMVl5JLp.js.map
