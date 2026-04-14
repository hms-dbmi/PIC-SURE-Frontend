import { describe, it, expect } from 'vitest';

// Test the parsing logic that configuration.ts uses for VITE_EXPORT_SYSTEM_FIELDS
function parseExportSystemFields(envValue: string): string[] {
  return (envValue || '')
    .split(',')
    .map((f: string) => f.trim())
    .filter(Boolean)
    .map((f: string) => `\\${f}\\`);
}

describe('Export System Fields parsing', () => {
  it('parses comma-separated fields into concept paths with slash wrappers', () => {
    const result = parseExportSystemFields(
      'patient_id,_consents,_Parent Study Accession with Subject ID,_Topmed Study Accession with Subject ID',
    );
    expect(result).toEqual([
      '\\patient_id\\',
      '\\_consents\\',
      '\\_Parent Study Accession with Subject ID\\',
      '\\_Topmed Study Accession with Subject ID\\',
    ]);
  });

  it('returns empty array for empty string', () => {
    expect(parseExportSystemFields('')).toEqual([]);
  });

  it('returns empty array for undefined/falsy', () => {
    expect(parseExportSystemFields(undefined as unknown as string)).toEqual([]);
  });

  it('trims whitespace from field names', () => {
    const result = parseExportSystemFields(' patient_id , _consents ');
    expect(result).toEqual(['\\patient_id\\', '\\_consents\\']);
  });

  it('filters out empty entries from trailing commas', () => {
    const result = parseExportSystemFields('patient_id,,_consents,');
    expect(result).toEqual(['\\patient_id\\', '\\_consents\\']);
  });

  it('handles single field', () => {
    const result = parseExportSystemFields('patient_id');
    expect(result).toEqual(['\\patient_id\\']);
  });
});
