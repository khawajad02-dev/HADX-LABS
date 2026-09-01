import { NextResponse } from "next/server";
import { Prisma, ProductStatus } from "@prisma/client";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { encodeProductDescription, normalizeProductSizes, normalizeRegionalPrices, serializeProduct, type ProductMedia } from "@/lib/product-meta";

export const dynamic = "force-dynamic";

const MAX_PAGE_SIZE = 50;

function normalizeMedia(input: unknown, fallbackImageUrl?: unknown): ProductMedia[] {
  const fromInput = Array.isArray(input)
    ? input
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => ({
          url: typeof entry.url === "string" ? entry.url.trim() : "",
          type: entry.type === "video" ? "video" as const : "image" as const,
          fileName: typeof entry.fileName === "string" ? entry.fileName : undefined,
        }))
        .filter((entry) => entry.url)
    : [];
  if (fromInput.length) return fromInput;
  return typeof fallbackImageUrl === "string" && fallbackImageUrl.trim()
    ? [{ url: fallbackImageUrl.trim(), type: "image" }]
    : [];
}

function normalizeDrop(input: unknown) {
  if (!input || typeof input !== "object") return undefined;
  const value = input as Record<string, unknown>;
  return { active: value.active === true, text: typeof value.text === "string" ? value.text.trim().slice(0, 80) : undefined, startsAt: typeof value.startsAt === "string" ? value.startsAt : undefined, endsAt: typeof value.endsAt === "string" ? value.endsAt : undefined };
}
function normalizeColorVariants(input: unknown) {
  if (!Array.isArray(input)) return undefined;
  return input.map((entry) => { const value = entry as Record<string, unknown>; const media = normalizeMedia(value.media, value.imageUrl); const sizes = normalizeProductSizes(value.sizes); const raw = value.stockBySize && typeof value.stockBySize === "object" ? value.stockBySize as Record<string, unknown> : {}; const stockBySize = Object.fromEntries(sizes.map((size) => [size, Math.max(0, Math.floor(Number(raw[size]) || 0))])); return { name: typeof value.name === "string" ? value.name.trim().slice(0, 40) : "Unnamed", media, sizes, stockBySize }; }).filter((entry) => entry.name && entry.name !== "Unnamed");
}

function basePrice(body: any, regionalPrices: Record<string, number>) {
  const explicit = Number(body?.price);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const usd = Number(regionalPrices.USD);
  return Number.isFinite(usd) && usd > 0 ? usd : 0;
}

export async function POST(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied: Invalid Security Credentials" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const sku = typeof body?.sku === "string" ? body.sku.trim() : "";
    const regionalPrices = normalizeRegionalPrices(body?.regionalPrices);
    const price = basePrice(body, regionalPrices);
    const media = normalizeMedia(body?.media, body?.imageUrl);
    const sizes = normalizeProductSizes(body?.sizes);
    const rawStockBySize = body?.stockBySize && typeof body.stockBySize === "object" ? body.stockBySize as Record<string, unknown> : {};
    const stockBySize = Object.fromEntries(sizes.map((size) => [size, Math.max(0, Math.floor(Number(rawStockBySize[size]) || 0))]));
    if (!title || !sku || !price) {
      return NextResponse.json({ error: "Title, SKU, and a valid USD base price are required." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: encodeProductDescription(body?.description, { media, regionalPrices, sizes, stockBySize, drop: normalizeDrop(body?.drop), colorVariants: normalizeColorVariants(body?.colorVariants) }),
        sku,
        priceInCents: Math.round(price * 100),
        currency: body?.currency === "PKR" ? "PKR" : body?.currency === "EUR" ? "EUR" : "USD",
        imageUrl: media[0]?.url || null,
        category: typeof body?.category === "string" ? body.category.trim() || null : null,
        status: body?.status === "PUBLISHED" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
        stockQuantity: Object.values(stockBySize).reduce((total, value) => total + value, 0),
      },
    });

    return NextResponse.json({ message: "Product created successfully", product: serializeProduct(product) }, { status: 201 });
  } catch (error: any) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: error?.code === "P2002" ? "That SKU already exists." : "Product could not be created." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedPageSize = Number(url.searchParams.get("pageSize") || 24);
    const pageSize = Number.isFinite(requestedPageSize) ? Math.min(Math.max(Math.floor(requestedPageSize), 1), MAX_PAGE_SIZE) : 24;
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const query = url.searchParams.get("q")?.trim();
    const statusParam = url.searchParams.get("status")?.toUpperCase();
    const where: Prisma.ProductWhereInput = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ];
    }
    if (statusParam && Object.values(ProductStatus).includes(statusParam as ProductStatus)) where.status = statusParam as ProductStatus;

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: pageSize, skip: (page - 1) * pageSize }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ items: items.map(serializeProduct), total, page, pageSize, hasMore: page * pageSize < total });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Products are temporarily unavailable." }, { status: 500 });
  }
}
