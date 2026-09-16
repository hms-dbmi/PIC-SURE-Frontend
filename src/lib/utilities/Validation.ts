/**
 * Minimal, dependency-free interpreter for Laravel/validatorjs-style rule
 * strings (e.g. `'string|required|between:1,500'`). Syntax matches the
 * `validatorjs` npm package so schemas need no changes if we swap it in later.
 */

export interface FieldSchema {
  type?: string;
  label: string;
  placeholder?: string;
  help?: string;
  // Groups fields into one fieldset; see RegisterForm.svelte's groupBySection.
  section?: string;
  // Width in the section's two-column grid; 'half' (default) or 'full'.
  width?: 'half' | 'full';
  rules: string | string[];
  options?: Array<{ key: string; value: string; text: string }>;
}

export type FormSchema = Record<string, FieldSchema>;

type RuleCheck = (value: unknown, arg: string | null) => boolean;

function isSized(value: unknown): value is string | unknown[] {
  return Array.isArray(value) || typeof value === 'string';
}

const validators: Record<string, RuleCheck> = {
  required: (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  string: (value) => typeof value === 'string',
  array: (value) => Array.isArray(value) && value.length > 0,
  between: (value, arg) => {
    const [min, max] = (arg ?? '').split(',').map(Number);
    const size = isSized(value) ? value.length : Number(value);
    return size >= min && size <= max;
  },
  regex: (value, arg) => {
    if (typeof value !== 'string' || !arg) return false;
    const match = arg.match(/^\/(.*)\/([a-z]*)$/s);
    const re = match ? new RegExp(match[1], match[2]) : new RegExp(arg);
    return re.test(value);
  },
};

const messages: Record<string, (label: string, arg: string | null, value: unknown) => string> = {
  required: (label) => `${label} is required.`,
  string: (label) => `${label} must be text.`,
  array: (label) => `${label} needs at least one selection.`,
  between: (label, arg, value) => {
    const [min, max] = (arg ?? '').split(',');
    const unit = isSized(value) ? ' characters' : '';
    return `${label} must be between ${min} and ${max}${unit}.`;
  },
  regex: (label) => `${label} is not a valid format.`,
};

function normalizeRules(rules: string | string[]): string[] {
  return Array.isArray(rules) ? rules : rules.split('|');
}

// Split on the FIRST colon only, so args containing ':' or '|' (e.g. regex)
// survive intact — pass those rules as an array element, not a pipe string.
function parseRule(rule: string): { name: string; arg: string | null } {
  const i = rule.indexOf(':');
  return i === -1 ? { name: rule, arg: null } : { name: rule.slice(0, i), arg: rule.slice(i + 1) };
}

export function isRequired(rules: string | string[]): boolean {
  return normalizeRules(rules).some((rule) => parseRule(rule).name === 'required');
}

export function validateField(
  value: unknown,
  rules: string | string[],
  label: string,
): string | null {
  for (const raw of normalizeRules(rules)) {
    const { name, arg } = parseRule(raw);
    const check = validators[name];
    if (!check) continue; // unknown rule name -> skip rather than throw
    if (!check(value, arg)) return messages[name]?.(label, arg, value) ?? `${label} is invalid.`;
  }
  return null;
}

export function validateForm(
  schema: FormSchema,
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, config] of Object.entries(schema)) {
    const error = validateField(values[field], config.rules, config.label);
    if (error) errors[field] = error;
  }
  return errors;
}
