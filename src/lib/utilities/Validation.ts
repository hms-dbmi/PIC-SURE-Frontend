/**
 * Minimal, dependency-free interpreter for Laravel/validatorjs-style rule
 * strings, e.g. `'string|required|between:1,500'` or `['string', 'required',
 * 'regex:/.../']`. Rule syntax intentionally matches the `validatorjs` npm
 * package (https://github.com/skaterdav85/validatorjs), so a `FormSchema`
 * written against this file needs no changes if we ever swap in that (or
 * another Laravel-flavored) library — only the internals of `validateField`
 * / `validateForm` below would change, e.g.:
 *
 *   import LibValidator from 'validatorjs';
 *   export function validateForm(schema: FormSchema, values: Record<string, unknown>) {
 *     const rules = Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v.rules]));
 *     const labels = Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v.label]));
 *     const validation = new LibValidator(values, rules, {}, labels);
 *     return validation.passes() ? {} : Object.fromEntries(
 *       Object.keys(validation.errors.all()).map((field) => [field, validation.errors.first(field)]),
 *     );
 *   }
 *
 * Callers only depend on `FieldSchema`, `FormSchema`, `validateField`, and
 * `validateForm` — keep those signatures stable across any such swap.
 *
 * Adding a new rule (e.g. `email`, `min`, `max`) only requires an entry in
 * `validators` and `messages` below; the parsing logic doesn't change.
 */

export interface FieldSchema {
  type?: string;
  label: string;
  placeholder?: string;
  help?: string;
  // Optional grouping label - fields sharing the same section render together under one
  // fieldset (see RegisterForm.svelte's groupBySection). Fields without a section render
  // ungrouped, so this is purely additive and existing configs need no changes.
  section?: string;
  // Layout width within its section's two-column grid - 'half' (the default when
  // omitted) pairs two fields per row, 'full' spans both columns.
  width?: 'half' | 'full';
  rules: string | string[];
  options?: Array<{ key: string; value: string; text: string }>;
}

export type FormSchema = Record<string, FieldSchema>;

type RuleCheck = (value: unknown, arg: string | null) => boolean;

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
    const size = Array.isArray(value) || typeof value === 'string' ? value.length : Number(value);
    return size >= min && size <= max;
  },
  regex: (value, arg) => {
    if (typeof value !== 'string' || !arg) return false;
    const match = arg.match(/^\/(.*)\/([a-z]*)$/s);
    const re = match ? new RegExp(match[1], match[2]) : new RegExp(arg);
    return re.test(value);
  },
};

const messages: Record<string, (label: string, arg: string | null) => string> = {
  required: (label) => `${label} is required.`,
  string: (label) => `${label} must be text.`,
  array: (label) => `${label} needs at least one selection.`,
  between: (label, arg) => {
    const [min, max] = (arg ?? '').split(',');
    return `${label} must be between ${min} and ${max} characters.`;
  },
  regex: (label) => `${label} is not a valid format.`,
};

function normalizeRules(rules: string | string[]): string[] {
  return Array.isArray(rules) ? rules : rules.split('|');
}

// Split on the FIRST colon only, so a rule argument (e.g. a regex pattern
// containing its own ':' and '|') survives intact. This is why rules with
// such characters in their argument must be passed as an array element
// rather than folded into a pipe-delimited string.
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
    if (!check(value, arg)) return messages[name]?.(label, arg) ?? `${label} is invalid.`;
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
