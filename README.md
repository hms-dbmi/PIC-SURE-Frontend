# PIC-SURE Frontend

[![Tests](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/tests.yml/badge.svg)](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/tests.yml)
[![Docker Build](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/check-docker.yml/badge.svg)](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/check-docker.yml)
[![GitHub license](https://img.shields.io/github/license/hms-dbmi/pic-sure-hpds-ui)](https://github.com/hms-dbmi/PIC-SURE-Frontend/blob/main/LICENSE)

<b><i>NOTE: This project is still under its inital development</i></b>

Welcome to the PIC-SURE frontend project, a web-based graphical user interface for accessing and querying datasets hosted on the PIC-SURE HPDS (High-performance Data Store) platform.

The PIC-SURE Frontend is designed to provide an intuitive, easy-to-use interface for researchers, enabling them to explore and analyze large-scale biomedical datasets without requiring extensive programming knowledge.

If you are interested in running your own PIC-SURE Platform please check out our [All-In-One Project](https://github.com/hms-dbmi/pic-sure-all-in-one).

If you are looking for some guidance using PIC-SURE, checkout our [User Guide](https://pic-sure.gitbook.io/pic-sure).

## Contributing & Developing

This project is using SvelteKit! Check out the docs for svelte [here](https://svelte.dev/) and SvelteKit [here](https://kit.svelte.dev/).

Once you've cloned the project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

### Testing

If this is the first time testing is run, download new browsers:

```bash
npx playwright install
```

Run unit-tests:

```bash
npm run test
```

Or if you prefer a graphical interface:

```bash
npm run playwright
```

### Linting

Before sumbitting please test if there are linting errors that need to be fixed:

1. Format code using Prettier:

```bash
npm run format
```

2. Then run eslint:

```bash
npm run lint
```

### Building

To create a production version of your app:

```bash
npm run build
```

### Contribution

First, please refer to the [CONTRIBUTING](https://github.com/hms-dbmi/pic-sure-all-in-one/blob/master/CONTRIBUTING.md) file for guidelines on how to contribute, submit issues, and propose improvements.
Also, please refer to our [Code of Conduct](https://github.com/hms-dbmi/pic-sure-hpds/blob/master/CODE_OF_CONDUCT.md).

## Configuration

Some PIC-SURE features are configurable. We provide a feature flag file [here](https://github.com/hms-dbmi/PIC-SURE-Frontend/blob/dev/src/lib/configuration.ts).
This system is under active development and subject to change.

## Support

If you are looking for some guidance using PIC-SURE, checkout our [User Guide](https://pic-sure.gitbook.io/pic-sure).

Or feel free to start a [discussion](https://github.com/hms-dbmi/PIC-SURE-Frontend/discussions) or reach out via email to: [avillach_lab_developers@googlegroups.com](mailto:avillach_lab_developers@googlegroups.com)
