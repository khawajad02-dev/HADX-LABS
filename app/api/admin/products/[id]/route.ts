import { NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { decodeProductDescription, encodeProductDescription, normalizeProductSizes, normalizeRegionalPrices, serializeProduct, type ProductMedia } from "@/lib/product-meta";

type RouteContext = { params: { id: string } };

export const dynamic = "force-dynamic";

function normalizeMedia(input: unknown, fallbackImageUrl?: unknown): ProductMedia[] {
  const media = Array.isArray(input)
    ? input
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => ({
          url: typeof entry.url === "string" ? entry.url.trim() : "",
          type: entry.type === "video" ? "video" as const : "image" as const,
          fileName: typeof entry.fileName === "string" ? entry.fileName : undefined,
        }))
        .filter((entry) => entry.url)
    : [];
  if (media.length) return media;
  return typeof fallbackImageUrl === "string" && fallbackImageUrl.trim() ? [{ url: fallbackImageUrl.trim(), type: "image" }] : [];
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json(serializeProduct(product));
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json({ error: "Product could not be loaded." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });

    const body = await req.json();
    const current = await prisma.product.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const parsed = decodeProductDescription(current.description);
    const title = typeof body?.title === "string" ? body.title.trim() : current.title;
    const price = body?.price === undefined ? current.priceInCents / 100 : Number(body.price);
    const stockQuantity = body?.stockQuantity === undefined ? current.stockQuantity : Number(body.stockQuantity);
    if (!title || !Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Title and positive price are required." }, { status: 400 });
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) return NextResponse.json({ error: "Stock must be zero or a positive number." }, { status: 400 });

    const media = body?.media === undefined ? parsed.metadata.media || normalizeMedia(undefined, current.imageUrl) : normalizeMedia(body.media, body.imageUrl);
    const regionalPrices = body?.regionalPrices === undefined ? parsed.metadata.regionalPrices || {} : normalizeRegionalPrices(body.regionalPrices);
    const sizes = body?.sizes === undefined ? normalizeProductSizes(parsed.metadata.sizes) : normalizeProductSizes(body.sizes);
    const rawStockBySize = body?.stockBySize === undefined ? parsed.metadata.stockBySize || {} : (body.stockBySize && typeof body.stockBySize === "object" ? body.stockBySize as Record<string, unknown> : {});
    const stockBySize = Object.fromEntries(sizes.map((size) => [size, Math.max(0, Math.floor(Number(rawStockBySize[size]) || 0))]));
    const drop = body?.drop === undefined ? parsed.metadata.drop : body.drop;
    const colorVariants = body?.colorVariants === undefined ? parsed.metadata.colorVariants : body.colorVariants;
    const description = body?.description === undefined ? parsed.description : String(body.description || "").trim() || null;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        title,
        description: encodeProductDescription(description, { media, regionalPrices, sizes, stockBySize, drop, colorVariants }),
        ...(body?.sku ? { sku: String(body.sku).trim() } : {}),
        priceInCents: Math.round(price * 100),
        ...(body?.imageUrl !== undefined || body?.media !== undefined ? { imageUrl: media[0]?.url || null } : {}),
        ...(body?.category !== undefined ? { category: String(body.category || "").trim() || null } : {}),
        ...(body?.status === ProductStatus.PUBLISHED || body?.status === ProductStatus.DRAFT ? { status: body.status } : {}),
        stockQuantity: Object.values(stockBySize).reduce((total, value) => total + value, 0),
      },
    });

    return NextResponse.json({ message: "Product updated successfully", product: serializeProduct(product) });
  } catch (error: any) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: error?.code === "P2002" ? "That SKU already exists." : "Product could not be updated." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    if (!isAdminRequest(req)) return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: error?.code === "P2025" ? "Product not found." : "Product could not be deleted." }, { status: 500 });
  }
}
