// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';
import { branding } from '$lib/configuration';
import { getConceptDetails } from '$lib/stores/Dictionary';
import type { SearchResult } from '$lib/models/Search';

vi.mock('$lib/stores/Dictionary', () => ({
  getConceptDetails: vi.fn(),
}));

const mockGetConceptDetails = vi.mocked(getConceptDetails);

const data = {
  conceptPath: '\\test\\concept\\',
  dataset: 'dataset-1',
} as SearchResult;

function makeDetail(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    conceptPath: '\\test\\concept\\',
    dataset: 'dataset-1',
    name: 'variable-accession',
    display: 'Variable Display',
    studyAcronym: 'Root Study Acronym',
    description: 'Variable description',
    type: 'Categorical',
    allowFiltering: true,
    table: {
      conceptPath: '\\test\\table\\',
      dataset: 'dataset-1',
      name: 'dataset-accession',
      display: 'Dataset Display',
      studyAcronym: '',
      description: 'Dataset description',
      type: 'AnyRecordOf',
      allowFiltering: false,
    },
    study: {
      conceptPath: '\\test\\study\\',
      dataset: 'dataset-1',
      name: 'study-name',
      display: 'Study Display',
      studyAcronym: 'Study Acronym',
      fullName: 'Study Full Name',
      ref: 'study-accession',
      description: '',
      type: 'AnyRecordOf',
      allowFiltering: false,
    } as SearchResult,
    ...overrides,
  };
}

async function renderResultInfo(detail: SearchResult) {
  mockGetConceptDetails.mockResolvedValue(detail);
  render(ResultInfoComponent, { data });
  await screen.findByTestId('variable-info');
}

describe('ResultInfoComponent', () => {
  beforeEach(() => {
    mockGetConceptDetails.mockReset();
    branding.explorePage.resultInfo = {
      variableHeader: 'Variable Information',
      datasetHeader: 'Dataset Information',
      studyHeader: 'Study Information',
    };
  });

  it('renders configured section headers when the matching sections are present', async () => {
    branding.explorePage.resultInfo = {
      variableHeader: 'Custom Variable Header',
      datasetHeader: 'Custom Dataset Header',
      studyHeader: 'Custom Study Header',
    };

    await renderResultInfo(makeDetail());

    expect(screen.getByText('Custom Variable Header')).toBeInTheDocument();
    expect(screen.getByText('Custom Dataset Header')).toBeInTheDocument();
    expect(screen.getByText('Custom Study Header')).toBeInTheDocument();
  });

  it('renders all populated variable, dataset, and study fields', async () => {
    await renderResultInfo(makeDetail());

    expect(screen.getByTestId('variable-info')).toHaveTextContent('Name: Variable Display');
    expect(screen.getByTestId('variable-info')).toHaveTextContent('Accession: variable-accession');
    expect(screen.getByTestId('variable-info')).toHaveTextContent('Type: Categorical');
    expect(screen.getByTestId('variable-info')).toHaveTextContent(
      'Description: Variable description',
    );
    expect(screen.getByTestId('dataset-info')).toHaveTextContent('Name: Dataset Display');
    expect(screen.getByTestId('dataset-info')).toHaveTextContent('Accession: dataset-accession');
    expect(screen.getByTestId('dataset-info')).toHaveTextContent(
      'Description: Dataset description',
    );
    expect(screen.getByTestId('study-info')).toHaveTextContent('Study Name: Study Full Name');
    expect(screen.getByTestId('study-info')).toHaveTextContent('Study Accession: study-accession');
  });

  it('does not render dataset or study sections when those objects are missing', async () => {
    await renderResultInfo(makeDetail({ table: null, study: null }));

    expect(screen.getByTestId('variable-info')).toBeInTheDocument();
    expect(screen.queryByTestId('dataset-info')).not.toBeInTheDocument();
    expect(screen.queryByText('Dataset Information')).not.toBeInTheDocument();
    expect(screen.queryByTestId('study-info')).not.toBeInTheDocument();
    expect(screen.queryByText('Study Information')).not.toBeInTheDocument();
  });

  it('does not render field labels for missing values', async () => {
    await renderResultInfo(
      makeDetail({
        display: '',
        name: '',
        type: undefined,
        description: '',
        table: {
          ...makeDetail().table,
          display: '',
          name: '',
          description: '',
        } as SearchResult,
        study: {
          ...makeDetail().study,
          fullName: '',
          display: '',
          studyAcronym: '',
          ref: '',
        } as SearchResult,
        studyAcronym: '',
      } as Partial<SearchResult>),
    );

    expect(screen.queryByText(/Name:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Accession:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Type:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Description:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Study Name:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Study Accession:/)).not.toBeInTheDocument();
  });

  it.each([
    [{ fullName: 'Full Name', display: 'Display', studyAcronym: 'Acronym' }, 'Full Name'],
    [{ fullName: '', display: 'Display', studyAcronym: 'Acronym' }, 'Display'],
    [{ fullName: '', display: '', studyAcronym: 'Acronym' }, 'Acronym'],
  ])('renders study name using study fallback %#', async (studyOverrides, expectedStudyName) => {
    await renderResultInfo(
      makeDetail({
        study: {
          ...makeDetail().study,
          ...studyOverrides,
        } as SearchResult,
      }),
    );

    expect(screen.getByTestId('study-info')).toHaveTextContent(
      `Study Name: ${expectedStudyName}`,
    );
  });

  it('falls back to the root study acronym when study name fields are missing', async () => {
    await renderResultInfo(
      makeDetail({
        studyAcronym: 'Root Acronym',
        study: {
          ...makeDetail().study,
          fullName: '',
          display: '',
          studyAcronym: '',
        } as SearchResult,
      }),
    );

    expect(screen.getByTestId('study-info')).toHaveTextContent('Study Name: Root Acronym');
  });
});
