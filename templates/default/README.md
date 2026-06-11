# Arc/Astro default template

A minimal Astro site with the `@arc/astro` integration wired in.

## Scaffold

```sh
npm create astro@latest <my-project> -- --template arcxp/astro-templates/templates/default
```

`create-astro` performs the clone, prompts, install, and `git init`.

## Develop

```sh
pnpm install
cp example.arc.dev.json arc.dev.json
cp .env.example .env
pnpm dev
```

`pnpm dev` delegates to `arc dev`, which wraps `astro dev` and injects
the fixture tenant context from `arc.dev.json` so the `@arc/astro`
middleware accepts local requests instead of returning 502. The example
env sets `ARC_USE_FIXTURES=true`, so the first run renders content from
`arc.collections.json` offline — no Arc Content API token required.

`arc.dev.json` is local, per-developer fixture data and is gitignored —
copy the checked-in `example.arc.dev.json` (above) to create it. Edit it
to change the org / env / site identifiers your local dev server runs
under. `arc dev` watches the file and restarts the server on save.

## Build

```sh
pnpm build
```

`pnpm build` delegates to `arc build`, which validates `arc.config.ts`,
runs `astro build`, and assembles the deploy artifacts under `dist/`:
the Worker bundle and its static assets in `dist/worker/`, and the
generated manifest, build metadata, and `wrangler.generated.jsonc` in
`dist/arc/`. Set `LOG_LEVEL=debug` to trace each build step.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `ARC_API_TOKEN` | Production only | Bearer token for the Arc Content API. Optional locally when running fixtures. |
| `ARC_USE_FIXTURES` | No (default `false`) | Set to `true` to serve content from `arc.collections.json` instead of the live API. Only takes effect during `astro dev`; production builds always use live mode regardless of this value. |
| `LOG_LEVEL` | No (default `info`) | One of `debug` / `info` / `warn` / `error` / `silent`. Controls the `@arc/collections` logger verbosity. Set to `debug` locally to see every fetch and fixture lookup. |

Copy `.env.example` to `.env` to get started with local defaults:

```sh
cp .env.example .env
```

Set these in a `.env` file at the project root for local development. In production, inject them as secrets through your deployment platform (e.g. Cloudflare Workers secrets).
