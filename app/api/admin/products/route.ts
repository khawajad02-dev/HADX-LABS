import { NextResponse } from "next/server";
import { Prisma, ProductStatus } from "@prisma/client";

import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_PAGE_SIZE = 50;

export async function POST(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Access Denied: Invalid Security Credentials" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const sku = typeof body?.sku === "string" ? body.sku.trim() : "";
    const price = Number(body?.price);
    if (!title || !sku || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Title, price, and SKU are required." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: typeof body?.description === "string" ? body.description.trim() || null : null,
        sku,
        priceInCents: Math.round(price * 100),
        currency: body?.currency === "PKR" ? "PKR" : body?.currency === "EUR" ? "EUR" : "USD",
        imageUrl: typeof body?.imageUrl === "string" ? body.imageUrl.trim() || null : null,
        category: typeof body?.category === "string" ? body.category.trim() || null : null,
        status: body?.status === "PUBLISHED" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
        stockQuantity: Math.max(0, Math.floor(Number(body?.stockQuantity) || 0)),
      },
    });

    return NextResponse.json({ message: "Product created successfully", product }, { status: 201 });
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
    const pageSize = Number.isFinite(requestedPageSize)
      ? Math.min(Math.max(Math.floor(requestedPageSize), 1), MAX_PAGE_SIZE)
      : 24;
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
    if (statusParam && Object.values(ProductStatus).includes(statusParam as ProductStatus)) {
      where.status = statusParam as ProductStatus;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: pageSize, skip: (page - 1) * pageSize }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Products are temporarily unavailable." }, { status: 500 });
  }
}
