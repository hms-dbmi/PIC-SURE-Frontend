// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';

import ConfigKindTab from '$lib/components/admin/configuration/ConfigKindTab.svelte';
import { describeConfigField } from '$lib/models/ConfigResolution';
import {
  loadAdminConfig,
  isApiAvailable,
  adminConfigRows,
  deleteConfigRow,
} from '$lib/stores/AdminConfiguration';
import type { ConfigFieldSchema, ConfigObject } from '$lib/models/Configuration';
import type { FieldOrigin } from '$lib/models/ConfigResolution';

vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));

vi.mock('$lib/models/ConfigResolution', () => ({
  describeConfigField: vi.fn(),
}));

const { enabledFooSchema } = vi.hoisted(() => ({
  enabledFooSchema: {
    name: 'ENABLE_FOO',
    type: 'boolean',
    default: false,
    description: 'Enables foo.',
  } satisfies ConfigFieldSchema,
}));

vi.mock('$lib/models/Configuration', async () => {
  const actual = await vi.importActual<typeof import('$lib/models/Configuration')>(
    '$lib/models/Configuration',
  );
  return {
    ...actual,
    CONFIG_FIELD_SCHEMA: { features: [enabledFooSchema], settings: [], branding: [] },
    configApiEnvVarName: vi.fn().mockReturnValue('VITE_ADMIN_FEATURES_API'),
    deprecatedApiRows: vi.fn().mockReturnValue([]),
  };
});

vi.mock('$lib/stores/AdminConfiguration', async () => {
  const actual =
    await vi.importActual<typeof import('$lib/stores/AdminConfiguration')>(
      '$lib/stores/AdminConfiguration',
    );
  return {
    ...actual,
    loadAdminConfig: vi.fn().mockResolvedValue(undefined),
    isApiAvailable: vi.fn().mockReturnValue(true),
    deleteConfigRow: vi.fn(),
  };
});

const mockDescribeConfigField = vi.mocked(describeConfigField);
const mockLoadAdminConfig = vi.mocked(loadAdminConfig);
const mockIsApiAvailable = vi.mocked(isApiAvailable);
const mockDeleteConfigRow = vi.mocked(deleteConfigRow);
const mockDeprecatedApiRows = vi.mocked(
  (await import('$lib/models/Configuration')).deprecatedApiRows,
);

describe('ConfigKindTab', () => {
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

    render(ConfigKindTab, { kind: 'features' });

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

    render(ConfigKindTab, { kind: 'features' });

    const checkbox = (await screen.findByTestId(
      'config-field-input-ENABLE_FOO',
    )) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('shows the API-unavailable warning and disables the field when apiAvailable is false', async () => {
    mockIsApiAvailable.mockReturnValue(false);
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);

    render(ConfigKindTab, { kind: 'features' });

    expect(await screen.findByTestId('config-api-unavailable-features')).toBeInTheDocument();
    expect(screen.getByTestId('config-field-input-ENABLE_FOO')).toBeDisabled();
  });

  it('re-fetches with force=true when Refresh is clicked', async () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);

    render(ConfigKindTab, { kind: 'features' });
    await screen.findByTestId('config-tab-features');

    await fireEvent.click(screen.getByTestId('config-refresh-features'));

    expect(mockLoadAdminConfig).toHaveBeenLastCalledWith('features', true);
  });

  it('lists deprecated rows and deletes one when requested', async () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);
    const deprecatedRow: ConfigObject = { uuid: 'old-1', name: 'OLD_FIELD', value: 'x' };
    mockDeprecatedApiRows.mockReturnValue([deprecatedRow]);

    render(ConfigKindTab, { kind: 'features' });

    expect(await screen.findByTestId('config-deprecated-row-OLD_FIELD')).toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('config-deprecated-delete-OLD_FIELD'));

    expect(mockDeleteConfigRow).toHaveBeenCalledWith('features', 'old-1');
  });
});
