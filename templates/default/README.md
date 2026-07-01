# Arc/Astro default template

A minimal Astro site with the `@arc/astro` integration wired in.

## Deploy target (Arc-managed adapter)

Arc wires the deploy target for you. `astro.config.ts` sets `adapter: arcAdapter()` (from `@arc/astro/adapter`) and `integrations: [arc()]` — app code never imports a platform adapter package directly. To change or configure the target, go through Arc, not the adapter package.

`@astrojs/cloudflare` is listed in this project's `package.json` as an **Arc-managed dependency**. Do not import it in your app code, and do not remove it either: Astro/Vite resolve the adapter's server entrypoint (a bare `@astrojs/cloudflare/entrypoints/server` specifier) from the project root at `arc dev` / `arc build` time. If it is missing from `package.json`, the build fails with `Failed to resolve main entry file @astrojs/cloudflare/entrypoints/server`. Leave it declared and let Arc manage its version.

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

`pnpm dev` delegates to `arc dev`, which wraps `astro dev` and injects the fixture tenant context from `arc.dev.json` so the `@arc/astro` middleware accepts local requests instead of returning 502. The example env sets `ARC_USE_FIXTURES=true`, so the first run renders content from `arc.collections.json` offline — no Arc Content API token required.

`arc.dev.json` is local, per-developer fixture data and is gitignored — copy the checked-in `example.arc.dev.json` (above) to create it. Edit it to change the org / env / site identifiers your local dev server runs under. `arc dev` watches the file and restarts the server on save.

## Build

```sh
pnpm build
```

`pnpm build` delegates to `arc build`, which validates `arc.config.ts`, runs `astro build`, and assembles the deploy artifacts under `dist/`: the server runtime bundle, static assets, generated manifest, and build metadata. Set `LOG_LEVEL=debug` to trace each build step.

**Pin `ASTRO_KEY` for reproducible builds.** Astro generates a fresh server-island encryption key on every build unless `ASTRO_KEY` is set, which makes the server runtime bundle — and therefore the deploy release id — change each build, so `arc deploy` re-uploads an otherwise-unchanged site. Generate a key once with `pnpm exec astro create-key` and set `ASTRO_KEY` in your build environment (see `.env.example`). In production it's a managed per-site secret.

## Static assets and cacheability

Whichever compute provider serves the built Astro distribution should expose the static asset tree emitted by `arc build`. To let the CDN cache static files aggressively without manual invalidation, prefer content-hashed filenames for assets owned by the MX.

Use `src/assets/` for app-owned images, icons, fonts, and other files that should get hashed names. Import them from Astro components, pages, or CSS so Astro/Vite can add them to the build graph:

```astro
---
import logoUrl from "../assets/logo.svg?no-inline";
---

<img src={logoUrl} alt="Site logo" width="48" height="48" />
```

The `?no-inline` suffix is important for small assets, especially SVG icons: it prevents Vite from embedding the file as a data URL in the HTML or JS bundle, and instead emits a separate file with a content hash in its filename. When the file contents stay the same, the URL stays the same and the CDN can keep serving the cached file. When the file changes, the hash changes and browsers request the new URL.

Do not wrap imported asset URLs with `withBase()`. The imported value is already the final public URL for the build, including this MX's configured base path.

Reserve `public/` for files that must keep an exact, stable name, such as `robots.txt`, `favicon.ico`, web app manifests, or third-party verification files. Files in `public/` are copied as-is: they are not transformed, bundled, hashed, or affected by Rollup filename settings. If you place a logo or icon in `public/` and reference it as `/assets/logo.svg`, you are choosing a stable filename and giving up automatic cache busting for that file.

For groups of local assets selected by data, use static imports or `import.meta.glob()` so the build can still see the files. Avoid building local asset URLs with string concatenation at runtime; dynamic strings cannot be fingerprinted because the bundler cannot know which files to emit.

Images returned by Arc Content API fields, such as story promo images and author images, are remote content URLs. They are not part of this local build asset graph, so do not move or import them just to satisfy this rule.

## Deploy

```sh
pnpm run deploy --env <name>
```

`pnpm run deploy` delegates to `arc deploy`, which ships your built site to the named environment and prints a summary. Run `pnpm build` first — deploy uploads what `dist/` already contains and does not rebuild, and an unchanged build is detected and skipped.

> **Use `pnpm run deploy`, not `pnpm deploy`.** `deploy` is a built-in pnpm command, so the bare `pnpm deploy` shorthand runs _that_ built-in instead of this script — it never reaches `arc deploy` and fails with errors like `No project was selected for deployment` or `Unknown option: 'env'`. Always invoke it as `pnpm run deploy` (or `pnpm exec arc deploy`). `build`/`dev` don't collide with pnpm built-ins, which is why their shorthands work and `deploy`'s doesn't.

`--env` is **required** — there is no default, so a deploy can't silently target the wrong environment. Pass `--dry-run` to preview what would ship without uploading, or `--force` to re-deploy an unchanged build.

**Secrets are provisioned for you.** After the upload, `arc deploy` reads every variable your `astro.config.ts` declares with `access: "secret"` (here, `ARC_API_TOKEN`) from the environment the deploy runs in and sets it as a secret on the deployed Worker — so a live-mode site can reach the Arc Content API. Provide the value at deploy time; don't commit it:

```sh
ARC_API_TOKEN=… pnpm run deploy --env <name>
```

`--dry-run` lists the secret **names** that would be set (never their values). A required secret that's missing fails the deploy before uploading (`[ARC_E007]`); `ARC_API_TOKEN` is optional, so a fixtures build deploys without it.

## Linking inside vs. outside your MX

By default `arc.config.ts` sets `path: "/"`, so the site is served from the domain root. Change `path` to something like `/news` and `@arc/astro` wires that value through to Astro's `base` — the site's own routes now live under `/news`, and the mount prefix is exposed to every page/component as the Vite constant **`import.meta.env.BASE_URL`** (e.g. `"/news/"`).

There are three kinds of link, and only one of them touches the base:

1. **Content links — used verbatim.** A Content API `canonical_url` is the complete, authoritative path of a story (e.g. `/news/blog/my-entry`). Link to it with `canonical_url` exactly as returned, and look stories up with the requested path exactly as received — `website_url: Astro.url.pathname`. Never strip a base off the lookup and never prefix a canonical URL: the click → request → lookup round-trips only if nothing transforms the path. See `src/pages/[...slug].astro` and the `<a href={story.canonical_url}>` links in `StoryCard`.

2. **Cross-MX / cross-section links — also verbatim.** A link from this MX to a different one (e.g. `/politics/elections`, `/business`) is a full domain-root path served by another deployment. Write it as a plain `<a href="/politics/elections">`. Do **not** prefix it — it is not your route.

3. **Your own routes — prefix with the base.** The home (`/`) and the blog listing (`/blog`) are _this_ MX's Astro routes, so their hardcoded nav links must carry the mount prefix. Use the `withBase` helper from `@arc/astro/runtime` — it reads this MX's base (`import.meta.env.BASE_URL`) for you, normalizes the trailing slash, and leaves `#`/external hrefs alone:

   ```astro
   ---
   import { withBase } from "@arc/astro/runtime";
   ---
   <a href={withBase("/")}>Home</a>          <!-- /news/      -->
   <a href={withBase("/blog")}>Blog</a>       <!-- /news/blog  -->
   ```

   See the nav in `BaseLayout.astro`. If you'd rather not use the helper, read `import.meta.env.BASE_URL` directly — just mind its trailing slash: `` `${import.meta.env.BASE_URL}blog` `` → `/news/blog` (not `` `${base}/blog` ``, which double-slashes).

> `withBase` ships from `@arc/astro/runtime` and defaults its base to this MX's `import.meta.env.BASE_URL`. Pass an explicit second argument only for tests.

## Environment

| Variable           | Required             | Description                                                                                                                                                                                |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ARC_API_TOKEN`    | Production only      | Bearer token for the Arc Content API. Optional locally when running fixtures.                                                                                                              |
| `ARC_USE_FIXTURES` | No (default `false`) | Set to `true` to serve content from `arc.collections.json` instead of the live API. Only takes effect during `astro dev`; production builds always use live mode regardless of this value. |
| `LOG_LEVEL`        | No (default `info`)  | One of `debug` / `info` / `warn` / `error` / `silent`. Controls the `@arc/collections` logger verbosity. Set to `debug` locally to see every fetch and fixture lookup.                     |

Copy `.env.example` to `.env` to get started with local defaults:

```sh
cp .env.example .env
```

Set these in a `.env` file at the project root for local development. For a deploy, set the secrets (e.g. `ARC_API_TOKEN`) in the environment you run `arc deploy` in — it provisions every `access: "secret"` variable onto the Worker automatically (see [Deploy](#deploy)). You don't inject them by hand through a separate secret manager.
