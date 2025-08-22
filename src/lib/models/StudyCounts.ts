export interface StudyCountsData {
  abbreviation: string;
  accession: string;
  name: string;
  countsByConsent: { [consentCode: string]: number | string }; // Backend handles obfuscation
  totalCount: number | string; // Backend handles obfuscation
  isPublic: boolean;
  dbgapUrl?: string;
}
