// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import ConfigFieldRow from '$lib/components/admin/configuration/ConfigFieldRow.svelte';
import { describeConfigField } from '$lib/models/ConfigResolution';
import { addConfigRow, updateConfigRow, deleteConfigRow } from '$lib/stores/AdminConfiguration';
import type { ConfigFieldSchema, ConfigObject } from '$lib/models/Configuration';
import type { FieldOrigin } from '$lib/models/ConfigResolution';

vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));

vi.mock('$lib/models/ConfigResolution', () => ({
  describeConfigField: vi.fn(),
}));

vi.mock('$lib/stores/AdminConfiguration', async () => {
  const actual =
    await vi.importActual<typeof import('$lib/stores/AdminConfiguration')>(
      '$lib/stores/AdminConfiguration',
    );
  return {
    ...actual,
    addConfigRow: vi.fn(),
    updateConfigRow: vi.fn(),
    deleteConfigRow: vi.fn(),
  };
});

const mockDescribeConfigField = vi.mocked(describeConfigField);
const mockAddConfigRow = vi.mocked(addConfigRow);
const mockUpdateConfigRow = vi.mocked(updateConfigRow);
const mockDeleteConfigRow = vi.mocked(deleteConfigRow);

const booleanSchema: ConfigFieldSchema = {
  name: 'ENABLE_FOO',
  type: 'boolean',
  default: false,
  description: 'Enables foo.',
};

const stringSchema: ConfigFieldSchema = {
  name: 'APP_NAME',
  type: 'string',
  default: 'PIC-SURE',
  description: 'The application name.',
};

function baseProps(schema: ConfigFieldSchema, rows: ConfigObject[] = []) {
  return { schema, rows, apiAvailable: true, kind: 'features' as const };
}

describe('ConfigFieldRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pre-populates a boolean field from its env value when there is no API row', () => {
    mockDescribeConfigField.mockReturnValue({
      origin: 'env',
      envValue: 'true',
      disabled: false,
    } as FieldOrigin);

    render(ConfigFieldRow, baseProps(booleanSchema));

    const checkbox = screen.getByTestId('config-field-input-ENABLE_FOO') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    // Pre-populated, unedited state must not look dirty.
    expect(screen.getByTestId('config-field-save-ENABLE_FOO')).toBeDisabled();
  });

  it('pre-populates a boolean field from its schema default when there is no API row or env var', () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);

    render(ConfigFieldRow, baseProps({ ...booleanSchema, default: true }));

    const checkbox = screen.getByTestId('config-field-input-ENABLE_FOO') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(screen.getByTestId('config-field-save-ENABLE_FOO')).toBeDisabled();
  });

  it('pre-populates a text field from its schema default', () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);

    render(ConfigFieldRow, baseProps(stringSchema));

    const input = screen.getByTestId('config-field-input-APP_NAME') as HTMLInputElement;
    expect(input.value).toBe('PIC-SURE');
    expect(screen.getByTestId('config-field-save-APP_NAME')).toBeDisabled();
  });

  it('prefers the API row value over env/default when origin is api', () => {
    const apiRow: ConfigObject = { uuid: 'row-1', name: 'APP_NAME', value: 'Custom Name' };
    mockDescribeConfigField.mockReturnValue({
      origin: 'api',
      apiRow,
      disabled: false,
    } as FieldOrigin);

    render(ConfigFieldRow, baseProps(stringSchema, [apiRow]));

    expect((screen.getByTestId('config-field-input-APP_NAME') as HTMLInputElement).value).toBe(
      'Custom Name',
    );
  });

  it('marks the field dirty and enables Save once the pre-populated value is edited', async () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);

    render(ConfigFieldRow, baseProps(stringSchema));

    const input = screen.getByTestId('config-field-input-APP_NAME');
    const saveButton = screen.getByTestId('config-field-save-APP_NAME');
    expect(saveButton).toBeDisabled();

    await fireEvent.input(input, { target: { value: 'Something Else' } });

    expect(saveButton).toBeEnabled();
  });

  it('disables inputs and Save when the field is disabled (env overrides in override mode)', () => {
    mockDescribeConfigField.mockReturnValue({
      origin: 'env',
      envValue: 'true',
      disabled: true,
    } as FieldOrigin);

    render(ConfigFieldRow, baseProps(booleanSchema));

    expect(screen.getByTestId('config-field-input-ENABLE_FOO')).toBeDisabled();
    expect(screen.getByTestId('config-field-save-ENABLE_FOO')).toBeDisabled();
  });

  it('saves an edited value by adding a new API row when none exists yet', async () => {
    mockDescribeConfigField.mockReturnValue({ origin: 'default', disabled: false } as FieldOrigin);
    mockAddConfigRow.mockResolvedValue({ uuid: 'new', name: 'APP_NAME', value: 'New Name' });

    render(ConfigFieldRow, baseProps(stringSchema));

    await fireEvent.input(screen.getByTestId('config-field-input-APP_NAME'), {
      target: { value: 'New Name' },
    });
    await fireEvent.click(screen.getByTestId('config-field-save-APP_NAME'));

    expect(mockAddConfigRow).toHaveBeenCalledWith('features', 'APP_NAME', 'New Name');
    expect(mockUpdateConfigRow).not.toHaveBeenCalled();
  });

  it('saves an edited value by updating the existing API row', async () => {
    const apiRow: ConfigObject = { uuid: 'row-1', name: 'APP_NAME', value: 'Custom Name' };
    mockDescribeConfigField.mockReturnValue({
      origin: 'api',
      apiRow,
      disabled: false,
    } as FieldOrigin);
    mockUpdateConfigRow.mockResolvedValue({ ...apiRow, value: 'Updated Name' });

    render(ConfigFieldRow, baseProps(stringSchema, [apiRow]));

    await fireEvent.input(screen.getByTestId('config-field-input-APP_NAME'), {
      target: { value: 'Updated Name' },
    });
    await fireEvent.click(screen.getByTestId('config-field-save-APP_NAME'));

    expect(mockUpdateConfigRow).toHaveBeenCalledWith('features', {
      ...apiRow,
      value: 'Updated Name',
    });
  });

  it('resets to default by deleting the API row', async () => {
    const apiRow: ConfigObject = { uuid: 'row-1', name: 'APP_NAME', value: 'Custom Name' };
    mockDescribeConfigField.mockReturnValue({
      origin: 'api',
      apiRow,
      disabled: false,
    } as FieldOrigin);
    mockDeleteConfigRow.mockResolvedValue(undefined);

    render(ConfigFieldRow, baseProps(stringSchema, [apiRow]));

    await fireEvent.click(screen.getByTestId('config-field-reset-APP_NAME'));

    expect(mockDeleteConfigRow).toHaveBeenCalledWith('features', 'row-1');
  });
});
