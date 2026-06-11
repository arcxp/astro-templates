# astro-templates

Astro templates for the Arc runtime.

## Using a template

Scaffold a new project with Astro's standard scaffolder. `create-astro`
handles the clone, install, and `git init`:

```sh
npm create astro@latest <my-project> -- --template arcxp/astro-templates/templates/default
```

## Available templates

See [`manifest.json`](./manifest.json) for the current list. The manifest
is machine-readable so tooling can enumerate, describe, and scaffold from
templates programmatically.

## Adding a template

1. Add a directory under `templates/<name>/` containing a working Astro
   project. See `templates/default/` for the minimum shape.
2. Append an entry to `manifest.json`:
   ```json
   {
     "description": "<one-line>",
     "name": "<slug>",
     "path": "templates/<name>"
   }
   ```
3. Open a PR.

## Manifest schema

```json
{
  "repo": "arcxp/astro-templates",
  "templates": [
    {
      "description": "string",
      "name": "string",
      "path": "templates/<name>"
    }
  ]
}
```
