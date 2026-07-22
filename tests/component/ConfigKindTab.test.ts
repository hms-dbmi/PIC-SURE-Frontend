// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import ConfigKindTab from '$lib/components/admin/configuration/ConfigKindTab.svelte';
import { describeConfigField } from '$lib/models/ConfigResolution';
import {
  loadAdminConfig,
  isApiAvailable,
  adminConfigRows,
  deleteConfigRow,
  addConfigRow,
  invalidateConfigCache,
} from '$lib/stores/AdminConfiguration';
import type { ConfigFieldSchema, ConfigObject } from '$lib/models/Configuration';
import type { FieldOrigin } from '$lib/models/ConfigResolution';

vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));

vi.mock('$lib/models/ConfigResolution', () => ({
  describeConfigField: vi.fn(),
}));

const {
  enabledFooSchema,
  enabledBarSchema,
  soloSchema,
  featureExportSchema,
  settingExportSchema,
  brandingSchema,
  fillerSchemas,
} = vi.hoisted(() => ({
  enabledFooSchema: {
    name: 'ENABLE_FOO',
    type: 'boolean',
    default: false,
    description: 'Enables foo.',
    group: 'Group One',
  } satisfies ConfigFieldSchema,
  enabledBarSchema: {
    name: 'ENABLE_BAR',
    type: 'boolean',
    default: false,
    description: 'Enables bar.',
    group: 'Group Two',
  } satisfies ConfigFieldSchema,
  soloSchema: {
    name: 'SOLO_FIELD',
    type: 'boolean',
    default: false,
    description: 'The only field in its kind.',
    group: 'Solo Group',
  } satisfies ConfigFieldSchema,
  // Same group name on purpose, one per kind - exercises the merged tab bucketing a
  // feature and a setting into the same relation-based section.
  featureExportSchema: {
    name: 'FEATURE_EXPORT_THING',
    type: 'boolean',
    default: false,
    description: 'A feature related to export.',
    group: 'Export',
  } satisfies ConfigFieldSchema,
  settingExportSchema: {
    name: 'SETTING_EXPORT_THING',
    type: 'string',
    default: '',
    description: 'A setting related to export.',
    group: 'Export',
  } satisfies ConfigFieldSchema,
  // Its own kind (branding) so it stays the only field/group there - settings now has
  // two groups (Solo Group, Export) to exercise cross-kind merging above.
  brandingSchema: {
    name: 'BRANDING_FIELD',
    type: 'string',
    default: '',
    description: 'The only field in its kind.',
    group: 'Only Group',
  } satisfies ConfigFieldSchema,
  // ConfigKindTab only renders the search box once a tab has more than
  // SEARCH_BOX_MIN_LENGTH (10) fields - pad "features" past that so the
  // search-related tests below have a search box to interact with.
  fillerSchemas: Array.from(
    { length: 8 },
    (_, i) =>
      ({
        name: `FILLER_${i}`,
        type: 'boolean',
        default: false,
        description: `Filler field ${i}.`,
        group: 'Filler',
      }) satisfies ConfigFieldSchema,
  ),
}));

vi.mock('$lib/models/Configuration', async () => {
  const actual = await vi.importActual<typeof import('$lib/models/Configuration')>(
    '$lib/models/Configuration',
  );
  return {
    ...actual,
    CONFIG_FIELD_SCHEMA: {
      features: [enabledFooSchema, enabledBarSchema, featureExportSchema, ...fillerSchemas],
      settings: [soloSchema, settingExportSchema],
      branding: [brandingSchema],
    },
    configApiEnvVarName: vi.fn().mockReturnValue('VITE_ADMIN_FEATURES_API'),
    deprecatedApiRows: vi.fn().mockReturnValue([]),
  };
});

vi.mock('$lib/stores/AdminConfiguration', async () => {
  const actual = await vi.importActual<typeof import('$lib/stores/AdminConfiguration')>(
    '$lib/stores/AdminConfiguration',
  );
  return {
    ...actual,
    loadAdminConfig: vi.fn().mockResolvedValue(undefined),
    isApiAvailable: vi.fn().mockReturnValue(true),
    deleteConfigRow: vi.fn(),
    addConfigRow: vi.fn(),
    invalidateConfigCache: vi.fn(),
  };
});

const mockDescribeConfigField = vi.mocked(describeConfigField);
const mockLoadAdminConfig = vi.mocked(loadAdminConfig);
const mockIsApiAvailable = vi.mocked(isApiAvailable);
const mockDeleteConfigRow = vi.mocked(deleteConfigRow);
const mockAddConfigRow = vi.mocked(addConfigRow);
const mockInvalidateConfigCache = vi.mocked(invalidateConfigCache);
const mockDeprecatedApiRows = vi.mocked(
  (await import('$lib/models/Configuration')).deprecatedApiRows,
);

describe('ConfigKindTab (single kind)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAdminConfig.mockResolvedValue(undefined);
    mockIsApiAvailable.mockReturnValue(true);
    mockDeprecatedApiRows.mockReturnValue([]);
    adminConfigRows.features.set([]);
  });

  it('pre-populates the rendered field with the stored API row value', async () => {
    const apiRow: ConfigObject = { uuid: 'row-1', name: 'ENABLE_FOO', value: 'true' };
    mockDescribeConfigField.mockReturnValue({
      origin: 'api',
      apiRow,
      disabled: false,
    } as FieldOrigin);
    adminConfigRows.features.set([apiRow]);

    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });

    const checkbox = (await screen.findByTestId(
      'config-field-input-ENABLE_FOO',
    )) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('pre-populates the rendered field from env/default when there is no stored row', async () => {
    mockDescribeConfigField.mockReturnValue({
      origin: 'env',
      envValue: 'true',
      disabled: false,
    } as FieldOrigin);

    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });

    const checkbox = (await screen.findByTestId(
      'config-field-input-ENABLE_FOO',
    )) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('shows the API-unavailable warning and disables the field when apiAvailable is false', async () => {
    mockIsApiAvailable.mockReturnValue(false);
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);

    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });

    expect(await screen.findByTestId('config-api-unavailable-features')).toBeInTheDocument();
    expect(screen.getByTestId('config-field-input-ENABLE_FOO')).toBeDisabled();
  });

  it('invalidates the server-side cache and reloads when confirmed', async () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);
    mockInvalidateConfigCache.mockResolvedValue({} as never);
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });
    await screen.findByTestId('config-tab-features');

    await fireEvent.click(screen.getByTestId('config-invalidate-cache-features-btn'));
    await fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(mockInvalidateConfigCache).toHaveBeenCalled();
    await vi.waitFor(() => expect(reloadSpy).toHaveBeenCalled());
  });

  it('lists deprecated rows and deletes one when requested', async () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);
    const deprecatedRow: ConfigObject = { uuid: 'old-1', name: 'OLD_FIELD', value: 'x' };
    mockDeprecatedApiRows.mockReturnValue([deprecatedRow]);

    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });

    expect(await screen.findByTestId('config-deprecated-row-OLD_FIELD')).toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('config-deprecated-delete-OLD_FIELD'));

    expect(mockDeleteConfigRow).toHaveBeenCalledWith('features', 'old-1');
  });
});

describe('ConfigKindTab grouping and search (single kind)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAdminConfig.mockResolvedValue(undefined);
    mockIsApiAvailable.mockReturnValue(true);
    mockDeprecatedApiRows.mockReturnValue([]);
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);
    adminConfigRows.features.set([]);
    adminConfigRows.settings.set([]);
  });

  it('renders a section header per group when a kind has more than one group', async () => {
    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });

    const tab = await screen.findByTestId('config-tab-features');
    expect(tab).toHaveTextContent('Group One');
    expect(tab).toHaveTextContent('Group Two');
    expect(screen.getByTestId('config-field-row-ENABLE_FOO')).toBeInTheDocument();
    expect(screen.getByTestId('config-field-row-ENABLE_BAR')).toBeInTheDocument();
  });

  it('hides the section header when a kind has exactly one group', async () => {
    render(ConfigKindTab, { kinds: ['branding'], title: 'Branding' });

    const tab = await screen.findByTestId('config-tab-branding');
    expect(tab).not.toHaveTextContent('Only Group');
    expect(screen.getByTestId('config-field-row-BRANDING_FIELD')).toBeInTheDocument();
  });

  it('filters fields by search query, hiding groups with no matches', async () => {
    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });

    await screen.findByTestId('config-field-row-ENABLE_FOO');

    await fireEvent.input(screen.getByTestId('config-search-features'), {
      target: { value: 'bar' },
    });

    expect(screen.queryByTestId('config-field-row-ENABLE_FOO')).not.toBeInTheDocument();
    expect(screen.getByTestId('config-field-row-ENABLE_BAR')).toBeInTheDocument();
  });

  it('shows a no-results message when the search query matches nothing', async () => {
    render(ConfigKindTab, { kinds: ['features'], title: 'Features' });

    await screen.findByTestId('config-field-row-ENABLE_FOO');

    await fireEvent.input(screen.getByTestId('config-search-features'), {
      target: { value: 'nonexistent-field' },
    });

    expect(await screen.findByTestId('config-no-results-features')).toBeInTheDocument();
  });
});

describe('ConfigKindTab merged kinds (Settings & Features)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAdminConfig.mockResolvedValue(undefined);
    mockIsApiAvailable.mockReturnValue(true);
    mockDeprecatedApiRows.mockReturnValue([]);
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);
    adminConfigRows.features.set([]);
    adminConfigRows.settings.set([]);
  });

  it('loads and renders fields from every given kind', async () => {
    render(ConfigKindTab, { kinds: ['features', 'settings'], title: 'Settings & Features' });

    await screen.findByTestId('config-tab-features-settings');

    expect(mockLoadAdminConfig).toHaveBeenCalledWith('features', true);
    expect(mockLoadAdminConfig).toHaveBeenCalledWith('settings', true);
    expect(screen.getByTestId('config-field-row-ENABLE_FOO')).toBeInTheDocument();
    expect(screen.getByTestId('config-field-row-SOLO_FIELD')).toBeInTheDocument();
  });

  it('buckets a feature and a setting sharing a group name into one section', async () => {
    render(ConfigKindTab, { kinds: ['features', 'settings'], title: 'Settings & Features' });

    const group = await screen.findByTestId('config-group-features-settings-Export');
    expect(group).toHaveTextContent('Export');

    const featureRow = screen.getByTestId('config-field-row-FEATURE_EXPORT_THING');
    const settingRow = screen.getByTestId('config-field-row-SETTING_EXPORT_THING');
    expect(group).toContainElement(featureRow);
    expect(group).toContainElement(settingRow);
  });

  it('filters across kinds by search query', async () => {
    render(ConfigKindTab, { kinds: ['features', 'settings'], title: 'Settings & Features' });

    await screen.findByTestId('config-field-row-SOLO_FIELD');

    await fireEvent.input(screen.getByTestId('config-search-features-settings'), {
      target: { value: 'solo' },
    });

    expect(screen.queryByTestId('config-field-row-ENABLE_FOO')).not.toBeInTheDocument();
    expect(screen.getByTestId('config-field-row-SOLO_FIELD')).toBeInTheDocument();
  });

  it('saves a settings-kind field via the settings API, not features', async () => {
    mockAddConfigRow.mockResolvedValue({ uuid: 'new', name: 'SOLO_FIELD', value: 'true' });

    render(ConfigKindTab, { kinds: ['features', 'settings'], title: 'Settings & Features' });

    const checkbox = await screen.findByTestId('config-field-input-SOLO_FIELD');
    await fireEvent.click(checkbox);
    await fireEvent.click(screen.getByTestId('config-field-save-SOLO_FIELD'));

    expect(mockAddConfigRow).toHaveBeenCalledWith('settings', 'SOLO_FIELD', 'true');
  });

  it('shows one combined warning naming only the affected kind', async () => {
    mockIsApiAvailable.mockImplementation((kind: string) => kind !== 'settings');

    render(ConfigKindTab, { kinds: ['features', 'settings'], title: 'Settings & Features' });

    const warning = await screen.findByTestId('config-api-unavailable-features-settings');
    expect(warning).toHaveTextContent('settings');
    expect(warning).not.toHaveTextContent('features in this environment');
    expect(screen.getByTestId('config-field-input-SOLO_FIELD')).toBeDisabled();
    expect(screen.getByTestId('config-field-input-ENABLE_FOO')).not.toBeDisabled();
  });

  it('lists deprecated rows from every kind and deletes with the right kind', async () => {
    const deprecatedFeatureRow: ConfigObject = {
      uuid: 'old-feat',
      name: 'OLD_FEATURE',
      value: 'x',
    };
    const deprecatedSettingRow: ConfigObject = { uuid: 'old-set', name: 'OLD_SETTING', value: 'y' };
    mockDeprecatedApiRows.mockImplementation((kind: string) =>
      kind === 'features' ? [deprecatedFeatureRow] : [deprecatedSettingRow],
    );

    render(ConfigKindTab, { kinds: ['features', 'settings'], title: 'Settings & Features' });

    expect(await screen.findByTestId('config-deprecated-row-OLD_FEATURE')).toBeInTheDocument();
    expect(screen.getByTestId('config-deprecated-row-OLD_SETTING')).toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('config-deprecated-delete-OLD_SETTING'));

    expect(mockDeleteConfigRow).toHaveBeenCalledWith('settings', 'old-set');
  });
});
