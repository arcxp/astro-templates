import arc from "@arc/astro";
import { arcAdapter } from "@arc/astro/adapter";
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  adapter: arcAdapter(),
  env: {
    schema: {
      ARC_API_TOKEN: envField.string({ access: "secret", context: "server", optional: true }),
      ARC_USE_FIXTURES: envField.boolean({
        access: "public",
        context: "server",
        default: false,
      }),
      LOG_LEVEL: envField.enum({
        access: "public",
        context: "server",
        default: "info",
        values: ["debug", "error", "info", "silent", "warn"],
      }),
    },
  },
  integrations: [arc()],
  output: "server",
});
