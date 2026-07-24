import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    ignores: [
      '.DS_Store',
      '.env',
      '.env.*',
      '.svelte-kit/**',
      'build/**',
      'node_modules/**',
      'package/**',
      'package-lock.json',
      'playwright-report/**',
      'pnpm-lock.yaml',
      'test-results/**',
      'tests/end-to-end/.auth/**',
      'yarn.lock',
      '!.env.example',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  {
    files: ['**/*.{ts,svelte}'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    rules: {
      'svelte/require-each-key': 'off',
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  ...svelte.configs['flat/prettier'],
  {
    files: ['**/*.svelte.js', '**/*.svelte.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },
  prettier,
];
