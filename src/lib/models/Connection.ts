export interface Connection {
  uuid?: string;
  id: string;
  label: string;
  subPrefix: string;
  requiredFields: string;
}

export interface RequiredField {
  label: string;
  id: string;
}

export function parseFieldsFromJSON(json: string) {
  if (json === '') return [];

  try {
    const requiredFields: RequiredField[] = JSON.parse(json);
    return requiredFields;
  } catch (e) {
    console.error('Error parsing JSON required fields object.');
    return [];
  }
}
