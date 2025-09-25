export interface CleanedStudyData {
  abbreviation: string;
  name: string;
  countsByConsent: string[];
  accession: string; //as phs000000 no .v1.p1.c1
  fullAccession: string; //as phs000000.v1.p1.c1
  additional_info_link: string;
  isPublic: boolean;
  hasAccess?: boolean;
  totalCountSort?: number;
  countsByConsentMap?: { [consentCode: string]: string | number };
}
