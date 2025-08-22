import { get } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { resources } from '$lib/stores/Resources';
import { resultCounts } from '$lib/stores/ResultStore';
import { getBlankQueryRequest } from '$lib/utilities/QueryBuilder';
import type { StudyCountsData } from '$lib/models/StudyCounts';

export async function loadStudyCounts(isOpenAccess: boolean = false): Promise<StudyCountsData[]> {
  try {
    const currentResults = get(resultCounts);

    if (currentResults.length === 0) {
      console.warn('No existing cross-count data found, making fallback API call');
      return await loadStudyCountsFallback(isOpenAccess);
    }

    for (const stat of currentResults) {
      if (stat.result && typeof stat.result === 'object') {
        const studies = await extractStudiesFromStatResultAsync(stat);
        if (studies.length > 0) {
          return studies;
        }
      }
    }

    console.warn('Could not extract studies from existing results, making fallback API call');
    return await loadStudyCountsFallback(isOpenAccess);

  } catch (error) {
    console.error('Error loading study counts from existing data:', error);
    throw new Error('Failed to load study counts data');
  }
}

async function loadStudyCountsFallback(isOpenAccess: boolean = true): Promise<StudyCountsData[]> {
  try {
    const request = getBlankQueryRequest(isOpenAccess, get(resources).hpdsOpen, 'CROSS_COUNT');
    request.query.crossCountFields = ['\\_studies_consents\\'];

    const response = await api.post(Picsure.QuerySync, request);

    if (!response) {
      throw new Error('No study data available');
    }

    // Parse the response which contains the studies/consents data
    const studies: StudyCountsData[] = [];
    const phenotypeData = response;

    // Parse the hierarchical structure from the response
    for (const [path, count] of Object.entries(phenotypeData)) {
      const pathParts = path.split('\\').filter(p => p);

      if (pathParts.length === 1 && pathParts[0] === '_studies_consents') {
        // This is the total count - skip it as we process individual studies
        continue;
      }

      if (pathParts.length === 2) {
        // Study-level entry (e.g., \phs000007\)
        const studyId = pathParts[1];
        studies.push({
          abbreviation: extractStudyAbbreviation(studyId),
          accession: studyId,
          name: getStudyName(studyId),
          countsByConsent: {},
          totalCount: count as number | string,
          isPublic: isStudyPublic(studyId),
          dbgapUrl: getDbGaPUrl(studyId)
        });
      } else if (pathParts.length === 3) {
        // Consent-level entry (e.g., \phs000007\HMB\)
        const studyId = pathParts[1];
        const consentCode = pathParts[2];

        // Find existing study and add consent count
        const existingStudy = studies.find(s => s.accession === studyId);
        if (existingStudy) {
          existingStudy.countsByConsent[consentCode] = count as number | string;
        }
      }
    }

    return studies;
  } catch (error) {
    console.error('Error in fallback study counts loading:', error);
    throw new Error('Failed to load study counts data');
  }
}

async function extractStudiesFromStatResultAsync(stat: any): Promise<StudyCountsData[]> {
  const studies: StudyCountsData[] = [];

  if (stat.result && typeof stat.result === 'object') {
    for (const [resourceName, resultPromise] of Object.entries(stat.result)) {
      try {
        let resultData: any = resultPromise;

        if (resultPromise && typeof resultPromise === 'object' && 'then' in resultPromise) {
          resultData = await resultPromise;
        }

        if (resultData && typeof resultData === 'object') {
          const studiesData: Record<string, any> = {};

          for (const [path, count] of Object.entries(resultData)) {
            if (!path.startsWith('\\')) continue;

            const pathParts = path.split('\\').filter(p => p);

            if (pathParts.length === 1 && pathParts[0] === '_studies_consents') {
              continue;
            }

            if (pathParts.length === 2) {
              const studyId = pathParts[1];
              if (!studiesData[studyId]) {
                studiesData[studyId] = {
                  abbreviation: extractStudyAbbreviation(studyId),
                  accession: studyId,
                  name: getStudyName(studyId),
                  countsByConsent: {},
                  totalCount: count as number | string,
                  isPublic: isStudyPublic(studyId),
                  dbgapUrl: getDbGaPUrl(studyId)
                };
              }
            } else if (pathParts.length === 3) {
              const studyId = pathParts[1];
              const consentCode = pathParts[2];

              if (!studiesData[studyId]) {
                studiesData[studyId] = {
                  abbreviation: extractStudyAbbreviation(studyId),
                  accession: studyId,
                  name: getStudyName(studyId),
                  countsByConsent: {},
                  totalCount: 0,
                  isPublic: isStudyPublic(studyId),
                  dbgapUrl: getDbGaPUrl(studyId)
                };
              }
              studiesData[studyId].countsByConsent[consentCode] = count as number | string;
            }
          }

          studies.push(...Object.values(studiesData));
        }
      } catch (error) {
        console.warn(`Error processing resource ${resourceName}:`, error);
      }
    }
  }

  return studies;
}

function extractStudyAbbreviation(studyId: string): string {
  // Map known study IDs to their abbreviations
  const abbreviations: Record<string, string> = {
    'phs000007': 'FHS',
    'phs000179': 'COPDGene',
    'phs001194': 'PCGC',
    'tutorial-biolincc_framingham': 'FHS',
    'tutorial-biolincc_digitalis': 'DIG',
    'tutorial-biolincc_camp': 'CAMP'
  };
  return abbreviations[studyId] || studyId.substring(0, 8).toUpperCase();
}

function getStudyName(studyId: string): string {
  const names: Record<string, string> = {
    'phs000007': 'Framingham Heart Study',
    'phs000179': 'Genetic Epidemiology of COPD',
    'phs001194': 'Prostate Cancer Genetics Consortium',
    'tutorial-biolincc_framingham': 'Framingham Heart Study (Tutorial)',
    'tutorial-biolincc_digitalis': 'Digitalis Investigation Group Trial (Tutorial)',
    'tutorial-biolincc_camp': 'CAMP Trial (Tutorial)'
  };
  return names[studyId] || `Study ${studyId}`;
}

function isStudyPublic(studyId: string): boolean {
  return studyId.startsWith('tutorial-') || studyId.includes('public');
}

function getDbGaPUrl(studyId: string): string | undefined {
  if (isStudyPublic(studyId)) {
    return undefined; // Public studies don't need dbGaP links
  }
  return `https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=${studyId}`;
}

export function filterStudiesByCount(studies: StudyCountsData[], showLowCounts: boolean): StudyCountsData[] {
  if (showLowCounts) {
    return studies;
  }

  return studies.filter(study => {
    // Show study if total count is a number and >= 10
    if (typeof study.totalCount === 'number') {
      return study.totalCount >= 10;
    }

    // If total count is a string (obfuscated), check if it's not "< 10"
    if (typeof study.totalCount === 'string') {
      return !study.totalCount.includes('< 10');
    }

    return false;
  });
}
