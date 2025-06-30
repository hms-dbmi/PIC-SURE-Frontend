import type { QueryRequestInterface } from '$lib/models/api/Request';

export type PatientCount = string | number;

export interface PatientCountMap {
  [key: string]: PatientCount;
}

export type StatValue = PatientCount | PatientCountMap;

export interface StatConfig {
  key: string;
  label: string;
  value?: StatValue;
  auth?: boolean;
}

export interface StatField {
  label: string;
  id: string;
  conceptPath: string;
}

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
  request: QueryRequestInterface;
}
