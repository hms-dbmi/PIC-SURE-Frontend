export interface InfoColumn {
  key: string;
  description: string;
  isContinuous: boolean;
  min: number;
  max: number;
}

export const VariantKeys = {
  gene: 'Gene_with_variant',
  consequence: 'Variant_consequence_calculated',
  severity: 'Variant_severity',
  frequency: 'Variant_frequency_as_text',
};
