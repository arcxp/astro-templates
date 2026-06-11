/** Promo image attached to an Arc story (`promo_items.basic`). */
export interface PromoImage {
  alt_text?: string;
  caption?: string;
  height?: number;
  url?: string;
  width?: number;
}

/** CMS-original author fields exposed via `credits.by[i].additional_properties.original`. */
export interface AuthorOriginal {
  location?: string;
  role?: string;
}

/** A single author from a story's `credits.by` array. */
export interface Author {
  additional_properties?: { original?: AuthorOriginal };
  image?: { url?: string };
  name?: string;
}

/** A single tag from a story's `taxonomy.tags` array. */
export interface ArcTag {
  slug?: string;
  text?: string;
}

/** One element inside `content_elements` (paragraph, header, image, etc.). */
export interface ContentElement {
  _id?: string;
  alt_text?: string;
  caption?: string;
  content?: string;
  height?: number;
  items?: ContentElement[];
  level?: number;
  list_type?: "unordered" | "ordered";
  type: string;
  url?: string;
  width?: number;
}

/** Subset of the Arc story shape the template pages consume. */
export interface ArcStoryShape {
  _id: string;
  canonical_url?: string;
  content_elements?: ContentElement[];
  credits?: { by?: Author[] };
  description?: { basic?: string };
  display_date?: string;
  headlines?: { basic?: string };
  planning?: { story_length?: { word_count_actual?: number } };
  promo_items?: { basic?: PromoImage };
  publish_date?: string;
  taxonomy?: {
    primary_section?: { name?: string; path?: string };
    seo_keywords?: string[];
    tags?: ArcTag[];
  };
}

/**
 * Formats an ISO date string as a human-readable US English date.
 * Returns `null` for missing/invalid inputs so pages can skip rendering.
 */
export function formatDisplayDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}
