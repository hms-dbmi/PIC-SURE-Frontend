import { get, writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

const SETTING_NAME = 'datatableSettings';
export const DEFAULT_ROW_NUMBER = 10;

interface DefaultRowsMap {
  [key: string]: number;
}

const defaultRows: Writable<DefaultRowsMap> = writable(restoreSettings());

defaultRows.subscribe((rows: DefaultRowsMap) => {
  if (browser) {
    localStorage.setItem(SETTING_NAME, JSON.stringify(rows));
    console.log('updating default rows', rows);
  }
});

function restoreSettings() {
  if (browser && localStorage.getItem(SETTING_NAME)) {
    try {
      return JSON.parse(localStorage.getItem(SETTING_NAME) || '{}');
    } catch (e) {
      console.error('restoring user datatable settings failed');
      localStorage.setItem(SETTING_NAME, '{}');
      return {};
    }
  }
}

export function getDefaultRows(tableName?: string) {
  if (!tableName) return DEFAULT_ROW_NUMBER;
  const settings = get(defaultRows);
  if (!settings) return DEFAULT_ROW_NUMBER;

  if (settings[tableName]) {
    return settings[tableName];
  } else {
    settings[tableName] = DEFAULT_ROW_NUMBER;
    defaultRows.set(settings);
    return DEFAULT_ROW_NUMBER;
  }
}

export function setDefaultRows(tableName: string, rowValue: number) {
  const settings = get(defaultRows);
  settings[tableName] = rowValue;
  defaultRows.set(settings);
}
