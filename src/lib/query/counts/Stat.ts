import type { StatConfig } from '#lib/config/index.ts';

export type PatientCount = string | number | undefined;

export interface PatientCountMap {
  [key: string]: PatientCount;
}

export type StatValue = PatientCount | PatientCountMap;

export interface StatResultMap {
  [key: string]: Promise<StatValue>;
}

export interface StatResult {
  key: string;
  label: string;
  result: StatResultMap;
  auth?: boolean;
}

export interface RequestMapOptions {
  isOpenAccess: boolean;
  stat: StatConfig;
  addFilters: boolean;
}
