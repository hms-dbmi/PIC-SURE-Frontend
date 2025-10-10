import * as uuid from 'uuid';

const SESSION_NAMESPACE = uuid.v4();

export type UUID = `${string}-${string}-${string}-${string}-${string}` | null;

export function genericUUID(){
  return uuid.v4();
}

export function objectUUID(obj: any): string {
  return uuid.v5(JSON.stringify(obj), SESSION_NAMESPACE);
}