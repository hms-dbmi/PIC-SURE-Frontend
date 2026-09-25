# Contributing to PIC-SURE Frontend

Please read the [PIC-SURE contributing guide](https://github.com/hms-dbmi/pic-sure/blob/main/CONTRIBUTING.md)
first. It covers the code of conduct, filing issues, and how pull requests are reviewed across
every PIC-SURE repository.

## Building and testing this repo

Requires Node and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm run dev              # vite dev server
pnpm run check            # svelte-check typecheck
pnpm run lint             # prettier --check and eslint
pnpm run test:unit        # vitest, tests/unit
pnpm run test:component   # vitest, tests/component
pnpm run test:integration # playwright
```

`pnpm run precommit` runs format, lint, check and the full test suite together.
