import { writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import type { Column } from '$lib/models/Tables';

export const columns: Writable<Column[]> = writable([]);

// This any is deliberate. There is a field in that object for
// every column. Columns vary by environment
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const rows: Writable<any[]> = writable([]);

export type DashboardColumn = {
  label: string;
  dataElement: string;
};

export type DashboardResp = {
  columns: DashboardColumn[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  rows: any[];
};

function fetchDashboard(): Promise<DashboardResp> {
  return api.get('picsure/proxy/dictionary-api/dashboard');
}

export async function loadDashboardData() {
  const dashboardData = await fetchDashboard();
  columns.set(dashboardData.columns);
  rows.set(dashboardData.rows);
}
