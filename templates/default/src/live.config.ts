import { defineLiveCollection } from "astro:content";
import { arcCollections, arcStory, consoleLogger } from "@arc/collections";
import { ARC_API_TOKEN, ARC_USE_FIXTURES, LOG_LEVEL } from "astro:env/server";
import fixtures from "../arc.collections.json";

const logger = consoleLogger(LOG_LEVEL);

export const collections = {
  front: defineLiveCollection({
    loader: arcCollections({
      alias: "front",
      fixtures,
      logger,
      token: ARC_API_TOKEN,
      useFixtures: ARC_USE_FIXTURES,
    }),
  }),
  blog: defineLiveCollection({
    loader: arcCollections({
      alias: "blog",
      fixtures,
      logger,
      token: ARC_API_TOKEN,
      useFixtures: ARC_USE_FIXTURES,
    }),
  }),
  story: defineLiveCollection({
    loader: arcStory({
      fixtures,
      logger,
      token: ARC_API_TOKEN,
      useFixtures: ARC_USE_FIXTURES,
    }),
  }),
};
