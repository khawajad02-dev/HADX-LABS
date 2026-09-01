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

export type ProductColorVariant = {
  name: string;
  media?: ProductMedia[];
  sizes?: string[];
  stockBySize?: Record<string, number>;
};
export type ProductDrop = { active: boolean; text?: string; startsAt?: string; endsAt?: string };
export type ProductMetadata = {
  media?: ProductMedia[];
  regionalPrices?: RegionalPrices;
  sizes?: string[];
  stockBySize?: Record<string, number>;
  drop?: ProductDrop;
  colorVariants?: ProductColorVariant[];
};

function normalizeProductMedia(input: unknown): ProductMedia[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      url: typeof entry.url === "string" ? entry.url.trim() : "",
      type: entry.type === "video" ? "video" as const : "image" as const,
      fileName: typeof entry.fileName === "string" ? entry.fileName : undefined,
    }))
    .filter((entry) => entry.url);
}

export function normalizeProductColorVariants(input: unknown): ProductColorVariant[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => {
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      const legacyImage = typeof entry.imageUrl === "string" && entry.imageUrl.trim() ? [{ url: entry.imageUrl.trim(), type: "image" as const }] : [];
      const media = normalizeProductMedia(entry.media).length
        ? normalizeProductMedia(entry.media)
        : normalizeProductMedia(entry.images).length
          ? normalizeProductMedia(entry.images)
          : legacyImage;
      const sizes = normalizeProductSizes(entry.sizes);
      const rawStock = entry.stockBySize && typeof entry.stockBySize === "object" ? entry.stockBySize as Record<string, unknown> : {};
      const stockBySize = Object.fromEntries(sizes.map((size) => [size, Math.max(0, Math.floor(Number(rawStock[size]) || 0))]));
      return { name, media, sizes, stockBySize };
    })
    .filter((variant) => variant.name);
}

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
    stockBySize: parsed.metadata.stockBySize || {},
    drop: parsed.metadata.drop?.active ? parsed.metadata.drop : null,
    colorVariants: normalizeProductColorVariants(parsed.metadata.colorVariants),
  };
}
