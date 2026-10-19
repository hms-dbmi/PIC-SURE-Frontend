import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

// Files that already imported app code when the ui/utils boundary rules were added. The PR that
// cleans one removes it from this list; nothing new gets added.
const boundaryExceptions = [
  'src/lib/ui/OptionsSelectionList.svelte',
  'src/lib/ui/PlotlyPlot.svelte',
  'src/lib/ui/datatable/RemoteTable.svelte',
  'src/lib/ui/datatable/Row.svelte',
  'src/lib/ui/datatable/accessories/Pagination.svelte',
  'src/lib/ui/datatable/accessories/Rows.svelte',
  'src/lib/ui/datatable/accessories/Search.svelte',
  'src/lib/ui/stepper/Stepper.svelte',
  'src/lib/ui/tree/RemoteTree.svelte',
  'src/lib/ui/unsavedGuard.svelte.ts',
  'src/lib/utils/hierarchy.ts',
];

const skeletonOnlyInUi = {
  group: ['@skeletonlabs/*'],
  message: 'Only src/lib/ui/ may import Skeleton; use or add a ui/ primitive.',
};

// `folder` (under src/lib/) may import only from `allowed` folders and packages: no `#lib/` or
// `$lib/` specifier outside them, and no relative path that climbs out of `folder` (one config per
// nesting depth, so `../` is allowed exactly as deep as the file sits). Stylesheets are exempt.
function importBoundary(folder, allowed) {
  const message = `${folder}/ may import only ${allowed.map((f) => `${f}/`).join(', ')} and packages.`;
  return [1, 2, 3, 4, 5, 6].map((depth) => ({
    files: [`src/lib/${folder}/${'*/'.repeat(depth - 1)}*.{ts,svelte}`],
    ignores: ['**/*.test.ts', ...boundaryExceptions],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: `^[#$]lib/(?!(${allowed.join('|')})(/|$))`, message },
            { regex: `^(\\.\\./){${depth - 1}}\\.\\.(/|$)(?!.*\\.css$)`, message },
            // A later config's rule replaces an earlier one's, so repeat the Skeleton rule here.
            ...(folder === 'ui' ? [] : [skeletonOnlyInUi]),
          ],
        },
      ],
    },
  }));
}

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
  {
    // Typed linting is limited to tests to keep the rest of lint fast.
    files: ['tests/**/*.ts', 'src/**/*.test.ts', 'scripts/**/*.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message:
            'Wait for a condition (a web-first assertion, expect.poll, waitForRequest) instead of a fixed sleep.',
        },
        {
          // expect(x), expect.soft(x) or expect.poll(fn) used as a statement, with no matcher
          selector: [
            "ExpressionStatement > CallExpression[callee.name='expect']",
            "ExpressionStatement > AwaitExpression > CallExpression[callee.name='expect']",
            "ExpressionStatement > CallExpression[callee.object.name='expect'][callee.property.name=/^(soft|poll)$/]",
            "ExpressionStatement > AwaitExpression > CallExpression[callee.object.name='expect'][callee.property.name=/^(soft|poll)$/]",
          ].join(', '),
          message: 'expect(...) without a matcher asserts nothing.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,svelte}', 'tests/**/*.ts'],
    ignores: ['src/lib/ui/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [skeletonOnlyInUi] }],
    },
  },
  {
    // Skeleton's class vocabulary stays in ui/ too: call sites use ui/ variant props or the
    // tables in ui/button.ts and ui/surface.ts. (Test files keep their own no-restricted-syntax.)
    files: ['src/**/*.{ts,svelte}'],
    ignores: ['src/lib/ui/**', '**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: [
            'Literal[value=/(^|\\s)([\\w-]+:)?(preset-|btn(-(sm|xs|lg|icon(-(sm|lg|base))?))?(\\s|$))/]',
            'TemplateElement[value.raw=/(^|\\s)([\\w-]+:)?(preset-|btn(-(sm|xs|lg|icon(-(sm|lg|base))?))?(\\s|$))/]',
            'SvelteLiteral[value=/(^|\\s)([\\w-]+:)?(preset-|btn(-(sm|xs|lg|icon(-(sm|lg|base))?))?(\\s|$))/]',
            "SvelteAttribute[key.name='class'] SvelteLiteral[value=/(^|\\s)card(\\s|$)/]",
          ].join(', '),
          message:
            "Skeleton's preset-*, btn and card classes belong in src/lib/ui/; use a ui/ variant prop or ui/button.ts / ui/surface.ts.",
        },
      ],
    },
  },
  ...importBoundary('ui', ['ui', 'utils']),
  ...importBoundary('utils', ['utils']),
  ...importBoundary('config', ['config', 'api', 'assets', 'ui', 'utils']),
  ...svelte.configs['flat/prettier'],
  {
    files: ['**/*.svelte.js', '**/*.svelte.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },
  prettier,
];
