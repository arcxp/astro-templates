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

## Deploy

```sh
pnpm run deploy --env <name>
```

`pnpm run deploy` delegates to `arc deploy`, which ships your built site
to the named environment and prints a summary. Run `pnpm build` first —
deploy uploads what `dist/` already contains and does not rebuild, and an
unchanged build is detected and skipped.

> **Use `pnpm run deploy`, not `pnpm deploy`.** `deploy` is a built-in
> pnpm command, so the bare `pnpm deploy` shorthand runs *that* built-in
> instead of this script — it never reaches `arc deploy` and fails with
> errors like `No project was selected for deployment` or
> `Unknown option: 'env'`. Always invoke it as `pnpm run deploy` (or
> `pnpm exec arc deploy`). `build`/`dev` don't collide with pnpm built-ins,
> which is why their shorthands work and `deploy`'s doesn't.

`--env` is **required** — there is no default, so a deploy can't silently
target the wrong environment. Pass `--dry-run` to preview what would ship
without uploading, or `--force` to re-deploy an unchanged build.

## Linking inside vs. outside your MX

By default `arc.config.ts` sets `path: "/"`, so the site is served from the
domain root. Change `path` to something like `/news` and `@arc/astro` wires
that value through to Astro's `base` — the site's own routes now live under
`/news`, and the mount prefix is exposed to every page/component as the Vite
constant **`import.meta.env.BASE_URL`** (e.g. `"/news/"`).

There are three kinds of link, and only one of them touches the base:

1. **Content links — used verbatim.** A Content API `canonical_url` is the
   complete, authoritative path of a story (e.g. `/news/blog/my-entry`). Link to
   it with `canonical_url` exactly as returned, and look stories up with the
   requested path exactly as received — `website_url: Astro.url.pathname`. Never
   strip a base off the lookup and never prefix a canonical URL: the
   click → request → lookup round-trips only if nothing transforms the path.
   See `src/pages/[...slug].astro` and the `<a href={story.canonical_url}>` links
   in `StoryCard`.

2. **Cross-MX / cross-section links — also verbatim.** A link from this MX to a
   different one (e.g. `/politics/elections`, `/business`) is a full
   domain-root path served by another Worker. Write it as a plain
   `<a href="/politics/elections">`. Do **not** prefix it — it is not your route.

3. **Your own routes — prefix with the base.** The home (`/`) and the blog
   listing (`/blog`) are *this* MX's Astro routes, so their hardcoded nav links
   must carry the mount prefix. Use the `withBase` helper from
   `@arc/astro/runtime` — it reads this MX's base (`import.meta.env.BASE_URL`)
   for you, normalizes the trailing slash, and leaves `#`/external hrefs alone:

   ```astro
   ---
   import { withBase } from "@arc/astro/runtime";
   ---
   <a href={withBase("/")}>Home</a>          <!-- /news/      -->
   <a href={withBase("/blog")}>Blog</a>       <!-- /news/blog  -->
   ```

   See the nav in `BaseLayout.astro`. If you'd rather not use the helper, read
   `import.meta.env.BASE_URL` directly — just mind its trailing slash:
   `` `${import.meta.env.BASE_URL}blog` `` → `/news/blog` (not
   `` `${base}/blog` ``, which double-slashes).

> `withBase` ships from `@arc/astro/runtime` and defaults its base to this MX's
> `import.meta.env.BASE_URL`. Pass an explicit second argument only for tests.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `ARC_API_TOKEN` | Production only | Bearer token for the Arc Content API. Optional locally when running fixtures. |
| `ARC_USE_FIXTURES` | No (default `false`) | Serves content from `arc.collections.json` instead of the live API. On by default for local dev (see `.env.example`). To ship a build that serves fixtures with no Content API token, build with `arc build --use-fixtures` — it bakes fixture mode into the output. A normal build uses live mode. |
| `LOG_LEVEL` | No (default `info`) | One of `debug` / `info` / `warn` / `error` / `silent`. Controls the `@arc/collections` logger verbosity. Set to `debug` locally to see every fetch and fixture lookup. |

Copy `.env.example` to `.env` to get started with local defaults:

```sh
cp .env.example .env
```

Set these in a `.env` file at the project root for local development. In production, inject them as secrets through your deployment platform (e.g. Cloudflare Workers secrets).
