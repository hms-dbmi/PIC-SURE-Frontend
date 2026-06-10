# PIC-SURE Frontend

[![Tests](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/tests.yml/badge.svg)](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/tests.yml)
[![Docker Build](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/check-docker.yml/badge.svg)](https://github.com/hms-dbmi/PIC-SURE-Frontend/actions/workflows/check-docker.yml)
[![GitHub license](https://img.shields.io/github/license/hms-dbmi/pic-sure-hpds-ui)](https://github.com/hms-dbmi/PIC-SURE-Frontend/blob/main/LICENSE)

The user-facing web application for PIC-SURE — lets researchers search, filter, and export patient cohorts from clinical and genomic datasets. Built with [SvelteKit](https://kit.svelte.dev/), [Skeleton v3](https://v3.skeleton.dev/), and [Tailwind CSS](https://tailwindcss.com/).

To deploy the full PIC-SURE platform, see [pic-sure-all-in-one](https://github.com/hms-dbmi/pic-sure-all-in-one).

## Table of Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [Support](#support)

## Requirements

- [Node.js](https://nodejs.org/) (see `.nvmrc` for the expected version)
- [pnpm](https://pnpm.io/)

## Getting Started

```bash
git clone https://github.com/hms-dbmi/PIC-SURE-Frontend
cd PIC-SURE-Frontend
pnpm install
cp .env.example .env
```

Edit `.env` before starting the dev server. At minimum you need:

- **Auth provider settings** (`VITE_AUTH_PROVIDER_MODULE_*`) — configures how users log in (e.g. Auth0 + Google OAuth2)
- **Auth0 tenant** (`VITE_AUTH0_TENANT`)
- **HPDS resource UUID** (`VITE_RESOURCE_HPDS`) — points the UI at the query engine

```bash
pnpm run dev
```

The dev server starts at `http://localhost:5173`. You'll need a running PIC-SURE backend to log in and query data.

## Configuration

Configuration is done through environment variables in `.env`. See [`.env.example`](.env.example) for all available options with inline comments.

Settings are grouped into a few categories:

| Category         | Variables                                                    | What it controls                       |
| ---------------- | ------------------------------------------------------------ | -------------------------------------- |
| Auth providers   | `VITE_AUTH_PROVIDER_MODULE_*`                                | Login methods shown on the login page  |
| Resources        | `VITE_RESOURCE_HPDS`, `VITE_RESOURCE_OPEN_HPDS`, etc.        | Which backend resources the UI queries |
| Pages & features | `VITE_OPEN`, `VITE_DASHBOARD`, `VITE_VARIANT_EXPLORER`, etc. | Which pages and features are enabled   |
| Theming          | `VITE_LOGO`, `VITE_DOTS_COLORS_CLASS`                        | Logo and login page appearance         |
| Export           | `VITE_ALLOW_EXPORT`, `VITE_ALLOW_DOWNLOAD`, etc.             | Data export behavior                   |
| Analytics        | `VITE_GOOGLE_ANALYTICS_ID`, `VITE_GOOGLE_TAG_MANAGER_ID`     | Tracking (leave blank to disable)      |

For full configuration documentation, see the [PIC-SURE Frontend Configuration Guide](https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure/pic-sure-frontend-configuration).

## Project Structure

### Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)** — framework (routing, SSR, layouts)
- **[Skeleton v3](https://v3.skeleton.dev/)** — UI component library
- **[Tailwind CSS](https://tailwindcss.com/)** — utility-first styling
- **[Playwright](https://playwright.dev/)** — integration testing
- **[Vitest](https://vitest.dev/)** — unit and component testing

### Routing

Routes use SvelteKit's [layout groups](https://kit.svelte.dev/docs/advanced-routing#advanced-layouts) to enforce access control at each level:

```
src/routes/
├── (authentication)/     # Login pages
└── (picsure)/            # Main app shell
    ├── (public)/         # Open-access routes (explorer, discover, help, dashboard)
    └── (authorized)/     # Requires a valid auth token
        └── (admin)/      # Admin-only (user management, roles, connections)
```

- **(public)** routes are what users see in `open` and `explore` auth modes — accessible without logging in.
- **(authorized)** routes require a valid token. The layout file at this level checks token presence and expiration, redirecting to login if needed.
- **(admin)** routes are restricted to users with admin privileges.

Auth is enforced by layout files (`+layout.ts`) at each group level, using SvelteKit's cascading layout pattern.

### Source Organization

```
src/lib/
├── components/    # Feature-scoped UI (explorer, admin, query, plots, etc.)
├── services/      # API communication
├── stores/        # Svelte stores (user state, query state, etc.)
├── models/        # TypeScript types
├── auth/          # Authentication utilities
└── utilities/     # Helper functions
```

## Development

### Commands

| Command           | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `pnpm run dev`    | Start dev server with hot reload               |
| `pnpm run build`  | Production build                               |
| `pnpm run check`  | Svelte and TypeScript checks                   |
| `pnpm run format` | Format code with Prettier                      |
| `pnpm run lint`   | Lint with Prettier + ESLint                    |
| `pnpm run test`   | Run all tests (unit + component + integration) |

### Before Submitting

Run all checks before submitting a PR:

```bash
pnpm run format && pnpm run lint && pnpm run check && pnpm run test
```

### Integration Tests

If this is your first time running integration tests, install Playwright browsers:

```bash
pnpx playwright install
```

## Contributing

Please refer to [CONTRIBUTING](https://github.com/hms-dbmi/pic-sure-all-in-one/blob/master/CONTRIBUTING.md) for guidelines on how to contribute, submit issues, and propose improvements.

Also refer to our [Code of Conduct](https://github.com/hms-dbmi/pic-sure-hpds/blob/master/CODE_OF_CONDUCT.md).

## Configuration

Some PIC-SURE text is configurable. We provide a configuration file that is used for custom text elements [here](https://github.com/hms-dbmi/PIC-SURE-Frontend/blob/dev/src/lib/assets/configuration.json).
Feature flags and settings are stored in the picsure-db, accessing from the picsure api on route `GET:/picsure/configuration` and loaded into svelte on the server side which can be accessed by the client on route `GET:/api/config`. There are defaults located in [here](https://github.com/hms-dbmi/PIC-SURE-Frontend/blob/dev/src/lib/configuration.ts).

This system is under active development and subject to change.

## Support

- [PIC-SURE User Guide](https://pic-sure.gitbook.io/pic-sure)
- [GitHub Discussions](https://github.com/hms-dbmi/PIC-SURE-Frontend/discussions)
- Email: [avillach_lab_developers@googlegroups.com](mailto:avillach_lab_developers@googlegroups.com)
