import { browser } from '$app/env';

// Each table's rows-per-page choice, keyed by its tableName.
const SETTING_NAME = 'datatableSettings';
export const DEFAULT_ROW_NUMBER = 10;

type RowsSettings = Record<string, number>;

function readSettings(): RowsSettings {
  const stored = localStorage.getItem(SETTING_NAME);
  if (!stored) return {};
  try {
    const settings = JSON.parse(stored);
    if (settings && typeof settings === 'object') return settings;
    throw new TypeError(`expected an object, got ${stored}`);
  } catch (e) {
    console.error('restoring user datatable settings failed: ', e);
    localStorage.setItem(SETTING_NAME, '{}');
    return {};
  }
}

function writeSettings(settings: RowsSettings) {
  localStorage.setItem(SETTING_NAME, JSON.stringify(settings));
}

export function getDefaultRows(tableName?: string) {
  if (!tableName || !browser) return DEFAULT_ROW_NUMBER;
  const settings = readSettings();
  if (settings[tableName]) return settings[tableName];

  settings[tableName] = DEFAULT_ROW_NUMBER;
  writeSettings(settings);
  return DEFAULT_ROW_NUMBER;
}

export function setDefaultRows(tableName: string, rowValue: number) {
  if (!browser) return;
  const settings = readSettings();
  settings[tableName] = rowValue;
  writeSettings(settings);
}
