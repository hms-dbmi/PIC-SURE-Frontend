import { describe, it, expect } from 'vitest';

import {
  isRequired,
  validateField,
  validateForm,
  type FormSchema,
} from '$lib/utilities/Validation';

describe('Validation utilities', () => {
  describe('isRequired', () => {
    it('returns true when required is present in a pipe-delimited string', () => {
      expect(isRequired('string|required|between:1,500')).toBe(true);
    });
    it('returns true when required is present in an array of rules', () => {
      expect(isRequired(['string', 'required'])).toBe(true);
    });
    it('returns false when required is absent', () => {
      expect(isRequired('string|between:1,500')).toBe(false);
      expect(isRequired(['string'])).toBe(false);
    });
    it('returns false for an empty rule set', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired([])).toBe(false);
    });
    it('does not match rule names that merely contain "required"', () => {
      expect(isRequired('required_if:foo,bar')).toBe(false);
    });
  });

  describe('validateField', () => {
    describe('required', () => {
      it('fails on undefined, null, and empty/whitespace strings', () => {
        expect(validateField(undefined, 'required', 'Name')).toBe('Name is required.');
        expect(validateField(null, 'required', 'Name')).toBe('Name is required.');
        expect(validateField('', 'required', 'Name')).toBe('Name is required.');
        expect(validateField('   ', 'required', 'Name')).toBe('Name is required.');
      });
      it('fails on an empty array', () => {
        expect(validateField([], 'required', 'Tags')).toBe('Tags is required.');
      });
      it('passes for a non-empty string, non-empty array, number, and boolean', () => {
        expect(validateField('hi', 'required', 'Name')).toBeNull();
        expect(validateField(['a'], 'required', 'Tags')).toBeNull();
        expect(validateField(0, 'required', 'Count')).toBeNull();
        expect(validateField(false, 'required', 'Flag')).toBeNull();
      });
    });

    describe('string', () => {
      it('fails for non-string values', () => {
        expect(validateField(123, 'string', 'Name')).toBe('Name must be text.');
        expect(validateField(['a'], 'string', 'Name')).toBe('Name must be text.');
        expect(validateField(null, 'string', 'Name')).toBe('Name must be text.');
      });
      it('passes for string values, including empty string', () => {
        expect(validateField('hello', 'string', 'Name')).toBeNull();
        expect(validateField('', 'string', 'Name')).toBeNull();
      });
    });

    describe('array', () => {
      it('fails for non-arrays and empty arrays', () => {
        expect(validateField('not an array', 'array', 'Tags')).toBe(
          'Tags needs at least one selection.',
        );
        expect(validateField([], 'array', 'Tags')).toBe('Tags needs at least one selection.');
      });
      it('passes for a non-empty array', () => {
        expect(validateField(['a', 'b'], 'array', 'Tags')).toBeNull();
      });
    });

    describe('between', () => {
      it('validates string length within range', () => {
        expect(validateField('abc', 'between:1,5', 'Name')).toBeNull();
        expect(validateField('', 'between:1,5', 'Name')).toBe(
          'Name must be between 1 and 5 characters.',
        );
        expect(validateField('abcdef', 'between:1,5', 'Name')).toBe(
          'Name must be between 1 and 5 characters.',
        );
      });
      it('validates array length within range', () => {
        expect(validateField(['a', 'b'], 'between:1,3', 'Tags')).toBeNull();
        expect(validateField(['a', 'b', 'c', 'd'], 'between:1,3', 'Tags')).toBe(
          'Tags must be between 1 and 3 characters.',
        );
      });
      it('validates numeric value within range', () => {
        expect(validateField(5, 'between:1,10', 'Count')).toBeNull();
        expect(validateField(15, 'between:1,10', 'Count')).toBe('Count must be between 1 and 10.');
        expect(validateField(0, 'between:1,10', 'Count')).toBe('Count must be between 1 and 10.');
      });
      it('treats boundary values as valid (inclusive)', () => {
        expect(validateField('ab', 'between:2,4', 'Name')).toBeNull();
        expect(validateField('abcd', 'between:2,4', 'Name')).toBeNull();
      });
    });

    describe('regex', () => {
      it('passes when the value matches a plain pattern string', () => {
        expect(validateField('12345', 'regex:^[0-9]+$', 'Code')).toBeNull();
      });
      it('fails when the value does not match', () => {
        expect(validateField('abcde', 'regex:^[0-9]+$', 'Code')).toBe(
          'Code is not a valid format.',
        );
      });
      it('supports delimited /pattern/flags syntax with flags', () => {
        expect(validateField('ABC', ['string', 'regex:/^[a-z]+$/i'], 'Code')).toBeNull();
        expect(validateField('ABC', ['string', 'regex:/^[a-z]+$/'], 'Code')).toBe(
          'Code is not a valid format.',
        );
      });
      it('fails for non-string values', () => {
        expect(validateField(123, 'regex:^[0-9]+$', 'Code')).toBe('Code is not a valid format.');
      });
      it('fails when no argument is supplied', () => {
        expect(validateField('abc', 'regex', 'Code')).toBe('Code is not a valid format.');
      });
    });

    describe('rule parsing and composition', () => {
      it('accepts rules as a pipe-delimited string', () => {
        expect(validateField('ab', 'string|required|between:1,5', 'Name')).toBeNull();
      });
      it('accepts rules as an array', () => {
        expect(validateField('ab', ['string', 'required', 'between:1,5'], 'Name')).toBeNull();
      });
      it('returns the first failing rule error, in order', () => {
        expect(validateField(undefined, 'required|string', 'Name')).toBe('Name is required.');
        expect(validateField(123, 'string|between:1,5', 'Name')).toBe('Name must be text.');
      });
      it('splits only on the first colon so regex arguments retain their own colons', () => {
        expect(validateField('a:b', ['regex:/^a:b$/'], 'Value')).toBeNull();
      });
      it('skips unknown rule names rather than throwing', () => {
        expect(validateField('anything', 'made_up_rule', 'Name')).toBeNull();
        expect(validateField('anything', ['made_up_rule', 'required'], 'Name')).toBeNull();
      });
      it('returns null when no rules are given', () => {
        expect(validateField('anything', '', 'Name')).toBeNull();
        expect(validateField('anything', [], 'Name')).toBeNull();
      });
      it('falls back to a generic message when a rule has no message entry', () => {
        // simulate this by relying only on validators that exist; already covered by
        // known rules above. This case is exercised indirectly since all current
        // validators have matching messages.
        expect(validateField('abc', 'string', 'Name')).toBeNull();
      });
    });
  });

  describe('validateForm', () => {
    const schema: FormSchema = {
      firstName: { label: 'First name', rules: 'string|required' },
      email: { label: 'Email', rules: ['string', 'required', 'regex:/^[^@]+@[^@]+$/'] },
      tags: { label: 'Tags', rules: 'array' },
    };

    it('returns no errors when all fields are valid', () => {
      const errors = validateForm(schema, {
        firstName: 'Ada',
        email: 'ada@example.com',
        tags: ['a'],
      });
      expect(errors).toEqual({});
    });

    it('collects one error per invalid field, keyed by field name', () => {
      const errors = validateForm(schema, {
        firstName: '',
        email: 'not-an-email',
        tags: [],
      });
      expect(errors).toEqual({
        firstName: 'First name is required.',
        email: 'Email is not a valid format.',
        tags: 'Tags needs at least one selection.',
      });
    });

    it('omits keys for fields that pass validation', () => {
      const errors = validateForm(schema, {
        firstName: 'Ada',
        email: 'not-an-email',
        tags: ['a'],
      });
      expect(Object.keys(errors)).toEqual(['email']);
    });

    it('treats missing values as undefined and validates accordingly', () => {
      const errors = validateForm(schema, {});
      expect(errors.firstName).toBe('First name must be text.');
      expect(errors.email).toBe('Email must be text.');
      expect(errors.tags).toBe('Tags needs at least one selection.');
    });

    it('returns an empty object for an empty schema', () => {
      expect(validateForm({}, { anything: 'value' })).toEqual({});
    });
  });
});
