# nest-Amin

A pnpm workspace containing the Vue web client and NestJS API service.

## Structure

```text
.
├── apps
│   ├── server  # NestJS API
│   └── web     # Vue 3 + Vite client
├── packages     # Shared workspace packages
├── package.json
└── pnpm-workspace.yaml
```

## Commands

Install all workspace dependencies from the repository root:

```sh
pnpm install
```

Run both applications in parallel:

```sh
pnpm dev
```

Run an individual application:

```sh
pnpm dev:web
pnpm dev:server
```

Build, test, lint, type-check, and format the workspace:

```sh
pnpm build
pnpm test
pnpm lint
pnpm type-check
pnpm format
```

Run a command in one workspace package:

```sh
pnpm --filter @nest-Amin/web build
pnpm --filter @nest-Admin/server test
```
