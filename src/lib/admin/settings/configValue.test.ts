import { describe, expect, it } from 'vitest';

import { configValueError, prettifyJson, serializeConfigValue } from './configValue.ts';

describe('configValueError', () => {
  it.each([
    ['int', ' -12 ', ''],
    ['int', '1.5', 'Must be an integer.'],
    ['json', '{"a":1}', ''],
    ['string', '{', ''],
    ['boolean', 'true', ''],
  ] as const)('%s %j → %j', (type, value, error) => {
    expect(configValueError(type, value)).toBe(error);
  });

  it('gives the parser message for malformed JSON', () => {
    expect(configValueError('json', '{')).not.toBe('');
  });
});

describe('serializeConfigValue', () => {
  it('normalises integers and JSON and keeps other values as typed', () => {
    expect(serializeConfigValue('int', ' 007 ')).toBe('7');
    expect(serializeConfigValue('json', '{ "a": [1, 2] }')).toBe('{"a":[1,2]}');
    expect(serializeConfigValue('string', ' x ')).toBe(' x ');
  });
});

describe('prettifyJson', () => {
  it('indents valid JSON and leaves malformed JSON alone', () => {
    expect(prettifyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettifyJson('{')).toBe('{');
  });
});
