export interface CleanedStudyData {
  abbreviation: string;
  name: string;
  countsByConsent: string[];
  accession: string; //as phs000000 no .v1.p1.c1
  additional_info_link: string;
  hasAccess?: boolean;
  countsByConsentMap?: { [consentCode: string]: number | string };
}