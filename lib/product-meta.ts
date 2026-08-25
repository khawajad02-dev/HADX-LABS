export type ProductMedia = {
  url: string;
  type: "image" | "video";
  fileName?: string;
};

export type RegionalPrices = {
  USD?: number;
  PKR?: number;
  INR?: number;
};

export const DEFAULT_PRODUCT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type ProductSize = (typeof DEFAULT_PRODUCT_SIZES)[number] | "XXL";

export type ProductMetadata = {
  media?: ProductMedia[];
  regionalPrices?: RegionalPrices;
  sizes?: string[];
};

export function normalizeProductSizes(input: unknown): string[] {
  if (!Array.isArray(input)) return [...DEFAULT_PRODUCT_SIZES];
  const sizes = input
    .map((value) => String(value).trim().toUpperCase())
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);
  return sizes.length ? sizes : [...DEFAULT_PRODUCT_SIZES];
}

const META_PREFIX = "__HADX_PRODUCT_META__";

export function encodeProductDescription(description: string | null | undefined, metadata: ProductMetadata) {
  const cleanDescription = description?.startsWith(META_PREFIX) ? decodeProductDescription(description).description : description?.trim() || "";
  return `${META_PREFIX}${JSON.stringify(metadata)}\n${cleanDescription}`;
}

export function decodeProductDescription(description: string | null | undefined): { description: string | null; metadata: ProductMetadata } {
  if (!description || !description.startsWith(META_PREFIX)) {
    return { description: description || null, metadata: {} };
  }
  const lineBreak = description.indexOf("\n");
  if (lineBreak < 0) return { description: null, metadata: {} };
  try {
    const metadata = JSON.parse(description.slice(META_PREFIX.length, lineBreak)) as ProductMetadata;
    return { description: description.slice(lineBreak + 1).trim() || null, metadata };
  } catch {
    return { description: description.slice(lineBreak + 1).trim() || null, metadata: {} };
  }
}

export function normalizeRegionalPrices(input: unknown): RegionalPrices {
  if (!input || typeof input !== "object") return {};
  const record = input as Record<string, unknown>;
  const prices: RegionalPrices = {};
  for (const currency of ["USD", "PKR", "INR"] as const) {
    const value = Number(record[currency]);
    if (Number.isFinite(value) && value > 0) prices[currency] = Math.round(value * 100) / 100;
  }
  return prices;
}

export function serializeProduct<T extends { description?: string | null; imageUrl?: string | null }>(product: T) {
  const parsed = decodeProductDescription(product.description);
  const media = parsed.metadata.media?.length
    ? parsed.metadata.media
    : product.imageUrl
      ? [{ url: product.imageUrl, type: "image" as const }]
      : [];
  return {
    ...product,
    description: parsed.description,
    media,
    regionalPrices: parsed.metadata.regionalPrices || {},
    availableSizes: normalizeProductSizes(parsed.metadata.sizes),
  };
}
